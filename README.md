# ORIYONI

Storefront for ORIYONI — a streetwear label selling heavyweight tees, hoodies
and accessories.

A Next.js 16 frontend (App Router, TypeScript, Tailwind CSS v4) in `frontend/`,
and a Django + Postgres API at the repository root.

## Getting started

```bash
npm --prefix frontend install
npm --prefix frontend run dev
```

The site runs at http://localhost:3000.

| Script                            | Purpose                    |
| --------------------------------- | -------------------------- |
| `npm --prefix frontend run dev`   | Development server         |
| `npm --prefix frontend run build` | Production build           |
| `npm --prefix frontend run start` | Serve the production build |
| `npm --prefix frontend run lint`  | ESLint                     |

## Structure

```
config/              Django project (settings, URLs, WSGI/ASGI)
core/                Shared building blocks and the health probe
requirements/        base.txt (runtime), dev.txt (tests and linting)
docker-compose.yml   Local Postgres
frontend/            Next.js storefront
  src/app/           Routes (home, shop, product, cart, wishlist, about, contact)
  src/components/    Shared UI, garment mockups, flags, icons
  src/context/       Cart, wishlist and language providers
  src/lib/           Product catalogue, translations, display helpers
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

Settings read from the environment, falling back to development defaults; see
`.env.example`. `.env` itself is never committed.

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

## Deploying to Netlify

The repo includes `netlify.toml`, so no build settings need to be entered by
hand.

1. In Netlify: **Add new site → Import an existing project → GitHub**.
2. Authorise Netlify and pick this repository.
3. Netlify reads `netlify.toml` — base directory `frontend`, build
   `npm run build`, publish `.next`, Node 22 — and installs the Next.js
   Runtime. Click **Deploy**.

Because the base directory is `frontend`, Netlify only builds the storefront;
the Django backend at the root is deployed separately.

Every push to the default branch triggers a deploy; pull requests get preview
deploys.

## Not built yet

Checkout is intentionally disabled — the button is inert and labelled as such
until payments are connected. Cart and wishlist state is per-browser
(`localStorage`) and does not sync across devices.
