# ORIYONI

Storefront for ORIYONI — a streetwear label selling heavyweight tees, hoodies
and accessories. Frontend only; no backend or payment processing yet.

Built with Next.js 16 (App Router), TypeScript and Tailwind CSS v4.

## Getting started

```bash
npm install
npm run dev
```

The site runs at http://localhost:3000.

| Script          | Purpose                          |
| --------------- | -------------------------------- |
| `npm run dev`   | Development server               |
| `npm run build` | Production build                 |
| `npm run start` | Serve the production build       |
| `npm run lint`  | ESLint                           |

## Structure

```
src/
  app/          Routes (home, shop, product, cart, wishlist, about, contact)
  components/   Shared UI, garment mockups, flags, icons
  context/      Cart, wishlist and language providers (localStorage-backed)
  lib/          Product catalogue, translations, display helpers
public/brand/   Crown crest logo and generated icons
```

## Languages

The site ships in **English and Russian**. A flag switcher sits in the header's
top-right on every page, with a second copy in the footer.

- All copy lives in `src/lib/i18n.ts`; both dictionaries are type-checked
  against each other, so a missing translation fails the build.
- Product names, descriptions, details and colours are localized in
  `src/lib/products.ts`.
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
3. Netlify reads `netlify.toml` (build `npm run build`, publish `.next`,
   Node 22) and installs the Next.js Runtime. Click **Deploy**.

Every push to the default branch triggers a deploy; pull requests get preview
deploys.

## Not built yet

Checkout is intentionally disabled — the button is inert and labelled as such
until payments are connected. Cart and wishlist state is per-browser
(`localStorage`) and does not sync across devices.
