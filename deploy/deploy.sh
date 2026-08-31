#!/usr/bin/env bash
#
# Deploys whatever is on origin/main. Run by .github/workflows/deploy.yml over
# SSH, and safe to run by hand.
#
# Order matters here. Everything that can fail is done before anything that
# changes state: dependencies and both builds run first, then the migration,
# then the restart. A build that breaks therefore leaves the previous version
# serving an unmigrated database, rather than a migrated database being served
# by code that predates the migration.
#
# set -e so a failed step stops the deploy rather than carrying on into the
# restart; set -u so a typo'd variable is an error rather than an empty string;
# pipefail so a failure mid-pipeline is not hidden by a successful tail.
set -euo pipefail

APP_DIR=/srv/oriyoni
# Absolute path so it matches the sudoers rule exactly; a PATH lookup would not.
SYSTEMCTL=/usr/bin/systemctl

cd "$APP_DIR"

# --------------------------------------------------------------- preflight --

# Checked before anything is built rather than at the restart. Actions has no
# terminal, so a missing sudoers rule fails with "a terminal is required to
# authenticate" — after two minutes of installing and compiling, and with an
# error naming neither the cause nor the fix.
if ! sudo -n -l "$SYSTEMCTL" restart oriyoni oriyoni-web >/dev/null 2>&1; then
    cat >&2 <<'ERR'
error: the deploy user cannot restart the services without a password.

GitHub Actions has no terminal, so sudo cannot prompt. Grant exactly this one
command on the server:

  echo 'deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart oriyoni oriyoni-web' \
    | sudo tee /etc/sudoers.d/oriyoni-deploy
  sudo chmod 440 /etc/sudoers.d/oriyoni-deploy
  sudo visudo -c
ERR
    exit 1
fi

PREVIOUS=$(git rev-parse --short HEAD)

# ------------------------------------------------------------------ source --

echo "==> Fetching origin/main"
git fetch --prune origin
# Reset rather than pull: the server's tree is a deployment artifact, not a
# working copy, and a merge conflict here would wedge the deploy. Ignored files
# — .env, frontend/.env.local, .venv, node_modules, media — are untouched.
git reset --hard origin/main
echo "    $PREVIOUS -> $(git rev-parse --short HEAD): $(git log -1 --pretty=%s)"

# ------------------------------------------------------------------- build --
# Nothing below this line changes what is being served until the restart.

echo "==> Python dependencies"
.venv/bin/pip install --quiet --disable-pip-version-check -r requirements/prod.txt

echo "==> Checking configuration"
# Proves settings import and pass Django's own deploy checks while the running
# site is still untouched — a settings file that raises, a missing app, a
# broken middleware path. It does not test the database: Django's checks never
# open a connection. That is covered by the migration below, which also runs
# before the restart. Warnings do not fail the deploy; only errors do, so the
# HSTS ones this project leaves off deliberately are fine.
.venv/bin/python manage.py check --deploy --fail-level ERROR

# Django validates the Host header against ALLOWED_HOSTS, so hardcoding
# 127.0.0.1 in the smoke test below would only work while the server's .env
# happened to list it — a deploy failing over a setting it should never have
# depended on. Ask the app what it accepts. Read here, while settings are known
# to import, so a config error surfaces as the check above rather than as a
# confusing failure after the restart.
HOST_HEADER=$(.venv/bin/python - <<'PYEOF'
import os

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()
from django.conf import settings

# "*" is a wildcard to Django but not a legal Host header, so skip it.
hosts = [h for h in settings.ALLOWED_HOSTS if h not in ("*", "")]
print(hosts[0] if hosts else "127.0.0.1")
PYEOF
)

echo "==> Building the storefront"
cd frontend
# npm ci, not install: it installs exactly what package-lock.json pins and
# fails loudly if the two disagree, so a deploy can never quietly resolve a
# different dependency tree than the one that was tested.
npm ci --no-audit --no-fund
npm run build
cd "$APP_DIR"

# ------------------------------------------------------------------ commit --

echo "==> Migrating"
.venv/bin/python manage.py migrate --noinput
.venv/bin/python manage.py collectstatic --noinput

echo "==> Restarting"
sudo "$SYSTEMCTL" restart oriyoni oriyoni-web

# ------------------------------------------------------------------ verify --

# journalctl needs privileges to read another unit's logs. If deploy is not in
# the systemd-journal or adm group this prints nothing, so it must never be the
# thing that decides the exit status — hence `|| true` on every call.
fail() {
    local unit=$1 what=$2
    {
        echo "$what did not come back after 30s. Last 40 lines from $unit:"
        journalctl -u "$unit" -n 40 --no-pager 2>/dev/null || echo "(no journal access for this user)"
        echo
        echo "The site is now serving a failed deploy. To go back, revert the"
        echo "commit on main and let this pipeline redeploy; the previous good"
        echo "revision was $PREVIOUS."
    } >&2
    exit 1
}

wait_for() {
    local unit=$1 what=$2
    shift 2
    for attempt in $(seq 1 15); do
        if curl -fsS -o /dev/null "$@" 2>/dev/null; then
            echo "    $what healthy"
            return 0
        fi
        sleep 2
    done
    fail "$unit" "$what"
}

echo "==> Smoke test (Host: $HOST_HEADER)"
wait_for oriyoni API -H "Host: $HOST_HEADER" http://127.0.0.1:8000/api/health/
wait_for oriyoni-web Storefront http://127.0.0.1:3000/

echo "==> Deployed $(git rev-parse --short HEAD)"
