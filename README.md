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
