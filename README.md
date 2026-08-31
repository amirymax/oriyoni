# ORIYONI

Storefront for ORIYONI — a streetwear label selling heavyweight tees, hoodies
and accessories.

A Next.js 16 frontend (App Router, TypeScript, Tailwind CSS v4) in `frontend/`,
and a Django + Postgres API at the repository root.

## Getting started

The storefront needs the API running, so start the backend first.

```bash
# Backend
python3 -m venv .venv
.venv/bin/pip install -r requirements/dev.txt
cp .env.example .env
docker compose up -d                      # Postgres on localhost:5432
.venv/bin/python manage.py migrate        # also seeds the catalogue
.venv/bin/python manage.py runserver      # API on :8000

# Storefront, in a second terminal
npm --prefix frontend install
npm --prefix frontend run dev             # site on :3000
```

The site runs at http://localhost:3000 and the API at http://localhost:8000.
Create an admin login with `.venv/bin/python manage.py createsuperuser` and
manage the shop at http://localhost:8000/admin/.

| Script                            | Purpose                        |
| --------------------------------- | ------------------------------ |
| `npm --prefix frontend run dev`   | Storefront development server  |
| `npm --prefix frontend run build` | Production build               |
| `npm --prefix frontend run lint`  | ESLint                         |
| `.venv/bin/pytest`                | Backend tests (needs Postgres) |
| `.venv/bin/ruff check .`          | Backend lint                   |
| `.venv/bin/python manage.py check_email` | Verify the mail settings work |

## Structure

```
config/              Django project (settings, URLs, WSGI/ASGI)
core/                Shared building blocks, health probe, error shape
accounts/            Email-keyed users, JWT cookie auth, password reset
catalog/             Products, variants, colours, categories
cart/                Server-side carts, guest and signed-in
orders/              Checkout and order history
wishlist/            Saved products
engagement/          Newsletter and contact form
requirements/        base.txt, dev.txt, prod.txt
docker-compose.yml   Local Postgres
Dockerfile           The backend image
frontend/            Next.js storefront
  src/app/           Routes (home, shop, product, cart, checkout, account, …)
  src/components/    Shared UI, garment mockups, flags, icons
  src/context/       Auth, cart, wishlist and language providers
  src/lib/           API client, catalogue adapter, translations
  public/brand/      Crown crest logo and generated icons
```

## Backend

Django 5.2 and Django REST Framework on Postgres. Locally the database runs in
Docker; production points `DATABASE_URL` at a real server.

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements/dev.txt
cp .env.example .env
docker compose up -d          # Postgres on localhost:5432
.venv/bin/python manage.py migrate
.venv/bin/python manage.py runserver
```

The API answers at http://localhost:8000/api/ and `GET /api/health/` reports
database connectivity — 200 when reachable, 503 when not.

| Command                       | Purpose                       |
| ----------------------------- | ----------------------------- |
| `.venv/bin/pytest`            | Test suite (needs Postgres up) |
| `.venv/bin/ruff check .`      | Lint                          |
| `.venv/bin/ruff format .`     | Format                        |
| `docker compose down`         | Stop Postgres (keeps data)    |
| `docker compose down -v`      | Stop and wipe the database    |
| `.venv/bin/python manage.py check_email [--to you@example.com]` | Check the mail settings, and optionally send a test |

Settings read from the environment, falling back to development defaults; see
`.env.example`. `.env` itself is never committed.

### Email

Development uses the console backend, which prints password reset and signup
confirmation links straight into the runserver log — no mail server needed.
Production points `EMAIL_*` at an SMTP relay. `manage.py check_email` reports
the resolved settings and opens a real connection; `--to` also sends a test
message. It distinguishes a rejected login from an unreachable host from an
unverified sender, because those look identical in a raw traceback and want
completely different fixes.

### Catalogue

Products live in Postgres and are managed from the Django admin. The eleven
products the storefront used to hardcode are loaded by a data migration, so a
fresh database comes up stocked and browsable.

| Endpoint                  | Purpose                                     |
| ------------------------- | ------------------------------------------- |
| `/api/products/`          | List, with `category`, `tag`, `on_sale`, `search`, `ordering` |
| `/api/products/{slug}/`   | One product, plus its copy and variants     |
| `/api/categories/`        | Categories in navigation order              |

Both are public and read-only; lists are paginated (`count`, `results`).

Bilingual text is stored as paired `name_en` / `name_ru` columns and served as
`{"en": …, "ru": …}` — the storefront's `Localized<T>` — so switching language
costs no round trip. There is no translation package and no locale
negotiation.

Stock lives on the **variant** (a product in one colour and one size), because
that is what a shopper picks and what runs out. The API reports only whether a
variant is buyable; the counts themselves stay in the admin.

Field names are snake_case throughout, and prices are numbers rather than
DRF's default decimal strings.

### Cart

| Endpoint                  | Method       | Purpose                    |
| ------------------------- | ------------ | -------------------------- |
| `/api/cart/`              | GET          | The current cart           |
| `/api/cart/`              | DELETE       | Empty it                   |
| `/api/cart/items/`        | POST         | Add `{sku, quantity}`      |
| `/api/cart/items/{id}/`   | PATCH        | Set a line's quantity (`0` removes it) |
| `/api/cart/items/{id}/`   | DELETE       | Remove a line              |

Every response is the whole cart, so a client never has to reconcile a patch
against its own state.

Carts work signed in or not. A guest cart is found by an opaque token in an
httpOnly cookie; a signed-in one hangs off the account and follows the shopper
between devices. **Signing in merges the two** — quantities add up, capped at
stock — because shopping first and signing in at checkout is the normal order.
The merge is a receiver on a sign-in signal, so `accounts` stays unaware that a
shop exists.

Carts are created lazily, so browsing leaves no rows behind, and lines read
prices live from the catalogue: a cart is a wish, not a contract. Prices are
frozen only when an order is placed.

Adding more than stock is refused, but that is a courtesy check against the
count as it stands — two shoppers can still both pass it for the last item.
Checkout is where stock is actually claimed.

### Wishlist, newsletter and contact

| Endpoint                        | Method | Auth | Purpose                    |
| ------------------------------- | ------ | ---- | -------------------------- |
| `/api/wishlist/`                | GET    | yes  | Saved products, in full    |
| `/api/wishlist/`                | POST   | yes  | Save `{slug}`              |
| `/api/wishlist/{slug}/`         | DELETE | yes  | Unsave                     |
| `/api/wishlist/sync/`           | POST   | yes  | Merge `{slugs}` from localStorage |
| `/api/newsletter/`              | POST   | no   | Subscribe `{email, language}` |
| `/api/newsletter/unsubscribe/`  | POST   | no   | Unsubscribe `{token}`      |
| `/api/contact/`                 | POST   | no   | `{name, email, subject, message, language}` |

The wishlist **needs an account**, unlike the cart: the point of saving
something is that it outlives the browser. Guests keep theirs in
`localStorage` and push it up through `sync/` after signing in, which adds
rather than replaces so another device's saves are not wiped.

Newsletter and contact are open to passers-by and rate limited per IP, since an
unauthenticated write endpoint is exactly what a spam script looks for.
Subscribing is idempotent and gives the same answer either way, so the form
cannot be used to test whether an address is on the list. Every subscriber gets
an opaque unsubscribe token for mailing footers.

A contact message is saved first and the shop is notified second, best effort —
a mail server having a bad day must not tell the visitor their message failed,
or they will send it twice.

### Orders

| Endpoint                   | Method | Purpose                          |
| -------------------------- | ------ | -------------------------------- |
| `/api/orders/checkout/`    | POST   | Turn the cart into an order      |
| `/api/orders/`             | GET    | The signed-in shopper's history  |
| `/api/orders/{number}/`    | GET    | One of their orders              |

**Guests can buy.** An account is not the price of a purchase — a guest gives
an email and gets the order back in the response. A signed-in shopper's order
is attached to their account and shows up in their history; guest orders have
no account to hang off, so they are not listed anywhere.

Checkout is the only place stock is claimed. It locks the variants, re-checks
availability inside the transaction, decrements, writes the order and empties
the cart — all or nothing. If any line cannot be filled the whole order is
refused and named, rather than a partial one being placed.

Every line **copies** the name, colour, size and price as they stood. Repricing
or renaming a product does not rewrite an old order, and deleting a variant
leaves its lines readable.

Shipping is free over $120 and $12 below it, matching the storefront's
promise. Totals are stored rather than recomputed, so an old order still adds
up to what was charged after the rules change.

Payments are not connected: orders land as `pending` and move on from the
admin. That is the seam a payment provider slots into.

### Accounts

Accounts are keyed by email — there is no username. Signing up needs an email
and a password and signs you straight in; there is no verification step, so the
only mail the backend sends is a password reset link (in English or Russian,
whichever the storefront asks for).

| Endpoint                           | Method     | Purpose                          |
| ---------------------------------- | ---------- | -------------------------------- |
| `/api/auth/csrf/`                  | GET        | Prime the CSRF cookie            |
| `/api/auth/register/`              | POST       | Create an account and sign in    |
| `/api/auth/login/`                 | POST       | Sign in                          |
| `/api/auth/refresh/`               | POST       | Rotate the token pair            |
| `/api/auth/logout/`                | POST       | Revoke the refresh token         |
| `/api/auth/me/`                    | GET, PATCH | Read or edit the profile         |
| `/api/auth/password/change/`       | POST       | Change a known password          |
| `/api/auth/password/reset/`        | POST       | Request a reset link             |
| `/api/auth/password/reset/confirm/`| POST       | Set a new password from the link |

Errors always come back in one shape, so the storefront needs a single code
path to render them:

```json
{ "detail": "The submitted data was not valid.", "errors": { "email": ["…"] } }
```

**Tokens live in httpOnly cookies.** Page JavaScript cannot read them, which
takes token theft off the table for cross-site scripting — but the browser then
attaches them to any request, so every write must also carry a CSRF token:

1. `GET /api/auth/csrf/` once, which sets a readable `csrftoken` cookie.
2. Send it back as an `X-CSRFToken` header on every POST/PATCH/DELETE.
3. Use `credentials: "include"` so the cookies travel at all.

Reads need no token. An `Authorization: Bearer …` header also works and skips
the CSRF check, which is the path for curl and server-to-server calls.

Access tokens last 15 minutes; refresh tokens last 14 days, rotate on use, and
the spent one is blacklisted so it cannot be replayed. Login, registration and
password reset are rate limited per IP.

If the storefront and API end up on different sites in production, set
`AUTH_COOKIE_SAMESITE=None` and `AUTH_COOKIE_SECURE=True` — browsers reject
`None` without `Secure`. Putting both behind one parent domain and setting
`AUTH_COOKIE_DOMAIN` lets you keep the stricter `Lax` default.

## Languages

The site ships in **English and Russian**. A flag switcher sits in the header's
top-right on every page, with a second copy in the footer.

- All copy lives in `frontend/src/lib/i18n.ts`; both dictionaries are
  type-checked against each other, so a missing translation fails the build.
- Product names, descriptions, details and colours are localized in
  `frontend/src/lib/products.ts`.
- The choice persists in `localStorage` and falls back to the browser locale.

Page `<title>` metadata is currently English-only, because it is rendered on the
server before the visitor's language preference is known. Moving language into
the URL (`/en/…`, `/ru/…`) would make titles and SEO fully bilingual — worth
doing if organic search matters.

## Deploying

Both halves run on one Ubuntu server behind nginx, on a single origin. gunicorn
serves Django on `127.0.0.1:8000` and `next start` serves the storefront on
`127.0.0.1:3000`; nginx sends `/api/`, `/admin/` and `/static/` to Django and
everything else to Next.js.

One origin rather than two hostnames is deliberate: auth cookies never cross a
site boundary, so CORS does not apply, the strict `SameSite=Lax` default keeps
working, and one certificate covers the site.

```
                    ┌─ /api/, /admin/, /static/ ─► gunicorn :8000 ─► Postgres
internet ─► nginx ──┤
                    └─ everything else ──────────► next start :3000
```

Postgres runs on the host, reachable only over loopback. The firewall opens 22,
80 and 443 and nothing else, so neither application port is reachable from
outside the machine.

### Layout on the server

| Path | What |
| ---- | ---- |
| `/srv/oriyoni` | The repository, owned by the `deploy` user |
| `/srv/oriyoni/.env` | Production settings, `chmod 600`, never committed |
| `/srv/oriyoni/.venv` | Python environment |
| `/srv/oriyoni/media` | Uploaded product photos — the only state outside Postgres |
| `/etc/systemd/system/oriyoni.service` | Django, from `deploy/oriyoni.service` |
| `/etc/systemd/system/oriyoni-web.service` | Storefront, from `deploy/oriyoni-web.service` |
| `/etc/nginx/sites-available/oriyoni` | From `deploy/nginx.conf` |

Logs are in the journal: `journalctl -u oriyoni -f`, `journalctl -u oriyoni-web -f`.

### Continuous deployment

`.github/workflows/deploy.yml` runs the backend suite and the storefront build
as two parallel jobs on every push and pull request. When both pass on `main`,
it pipes `deploy/deploy.sh` over SSH to the `deploy` user, which fetches
`origin/main`, installs dependencies, migrates, rebuilds the storefront,
restarts both services and smoke-tests them.

The script is piped rather than run from a path on the server. It lives in the
repo, so expecting it to already be there is circular — a server whose checkout
predates the script could never deploy the commit that adds it.

The restart happens only after both builds succeed, so a broken build leaves the
previous version serving rather than taking the site down.

Two repository secrets are required:

| Secret | Value |
| ------ | ----- |
| `SERVER_HOST` | The server's IP or hostname |
| `SSH_PRIVATE_KEY` | A deploy-only private key whose public half is in `deploy`'s `authorized_keys` |

The key should be dedicated to this server rather than a personal one, so it can
be revoked on its own.

`deploy` needs to restart the services without a password prompt, since Actions
cannot answer one. Grant exactly that and nothing more:

```
# /etc/sudoers.d/oriyoni-deploy
deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart oriyoni oriyoni-web
```

### What production must set

| Variable | Why |
| ----------------------- | ------------------------------------------------------ |
| `DJANGO_SECRET_KEY` | Generate one; the default is a development placeholder |
| `DJANGO_DEBUG` | `False` |
| `DJANGO_ALLOWED_HOSTS` | The site's hostname, plus `127.0.0.1` for the smoke test |
| `DATABASE_URL` | The real Postgres server |
| `FRONTEND_URL` | Where password reset and confirmation links point |
| `CSRF_TRUSTED_ORIGINS` | The site's origin |
| `EMAIL_*` | An SMTP relay, or account email goes nowhere |

`CORS_ALLOWED_ORIGINS` only matters if the storefront is ever served from a
different origin than the API; on this layout they are the same.

With `DJANGO_DEBUG=False` the security settings switch on by themselves: HTTPS
redirect, HSTS, secure cookies, and the browsable API off. `manage.py check
--deploy` is clean apart from HSTS subdomains and preload, which are left off
deliberately — both are hard to reverse and depend on how the domain is set up.

Django only learns the original scheme from `X-Forwarded-Proto`, which nginx
sets and settings already trust. Terminate TLS at nginx — without that header
the HTTPS redirect loops.

## Not built yet

Checkout is intentionally disabled — the button is inert and labelled as such
until payments are connected. Cart and wishlist state is per-browser
(`localStorage`) and does not sync across devices.
