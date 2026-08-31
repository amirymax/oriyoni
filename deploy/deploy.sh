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
cd "$APP_DIR"

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
sudo systemctl restart oriyoni oriyoni-web

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
