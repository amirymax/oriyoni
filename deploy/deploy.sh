#!/usr/bin/env bash
#
# Deploys whatever is on origin/main. Run by .github/workflows/deploy.yml over
# SSH, and safe to run by hand.
#
# set -e so a failed migration stops the deploy before the services restart on
# top of a database that did not finish upgrading; set -u so a typo'd variable
# is an error rather than an empty string; pipefail so a failure in the middle
# of a pipeline is not hidden by a successful tail.
set -euo pipefail

APP_DIR=/srv/oriyoni
# Absolute path so it matches the sudoers rule exactly; a PATH lookup would
# not.
SYSTEMCTL=/usr/bin/systemctl

cd "$APP_DIR"

# Checked before anything is built rather than at the restart. Actions has no
# terminal, so a missing sudoers rule fails with "a terminal is required to
# authenticate" — after two minutes of installing and compiling, and with an
# error that names neither the cause nor the fix.
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

echo "==> Fetching origin/main"
git fetch --prune origin
# Reset rather than pull: the server's tree is a deployment artifact, not a
# working copy, and a merge conflict here would wedge the deploy. Ignored files
# — .env, frontend/.env.local, the venv — are untouched by this.
git reset --hard origin/main
echo "    now at $(git rev-parse --short HEAD): $(git log -1 --pretty=%s)"

echo "==> Backend"
.venv/bin/pip install --quiet --disable-pip-version-check -r requirements/prod.txt
.venv/bin/python manage.py migrate --noinput
.venv/bin/python manage.py collectstatic --noinput

echo "==> Storefront"
cd frontend
# npm ci, not install: it installs exactly what package-lock.json pins and
# fails loudly if the two disagree, so a deploy can never quietly resolve a
# different dependency tree than the one that was tested.
npm ci --no-audit --no-fund
npm run build
cd "$APP_DIR"

echo "==> Restarting"
# Restarted only after both builds succeed, so a broken build leaves the
# previous version serving rather than taking the site down.
sudo "$SYSTEMCTL" restart oriyoni oriyoni-web

echo "==> Smoke test"
for attempt in $(seq 1 15); do
    if curl -fsS -o /dev/null http://127.0.0.1:8000/api/health/ 2>/dev/null; then
        echo "    API healthy"
        break
    fi
    if [ "$attempt" -eq 15 ]; then
        echo "    API did not come back — recent logs:" >&2
        journalctl -u oriyoni -n 40 --no-pager >&2
        exit 1
    fi
    sleep 2
done

for attempt in $(seq 1 15); do
    if curl -fsS -o /dev/null http://127.0.0.1:3000/ 2>/dev/null; then
        echo "    Storefront healthy"
        break
    fi
    if [ "$attempt" -eq 15 ]; then
        echo "    Storefront did not come back — recent logs:" >&2
        journalctl -u oriyoni-web -n 40 --no-pager >&2
        exit 1
    fi
    sleep 2
done

echo "==> Deployed"
