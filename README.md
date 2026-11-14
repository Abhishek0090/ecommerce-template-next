# Dummy Store - Next.js ecommerce template

A colorful, customizable storefront with an admin CMS, built with Next.js 16 (App Router), React 19,
TypeScript and Tailwind CSS 4. No database to install, no image or icon dependencies.

## Run

```bash
npm install
npm run dev        # store: http://localhost:3000   admin: http://localhost:3000/admin (password: admin)
```

Production:

```bash
# set ADMIN_PASSWORD and ADMIN_SECRET first (see Environment variables)
npm run build && npm start
```

## Storefront

- Home page: hero, perks, categories, featured products, promo banner, deals, reviews, newsletter
- Shop page with search, category, price, sale and stock filters plus sorting, all kept in the URL
- Product pages with color and size options, stock status, related products and JSON-LD for SEO
- Reviews with photos: rating breakdown (click a bar to filter), customer photo gallery, "with photos"
  filter, full-screen photo viewer, and a write-a-review form with up to 4 photos. New reviews wait for approval.
- Slide-out cart, cart page, free-shipping progress bar and coupon codes (`WELCOME10`, `COLOR20`)
- Three-step checkout. The server recalculates prices, checks stock and saves the order.
- Wishlist, toasts, mobile menu, closeable announcement bar
- 6 color palettes and light/dark/auto mode, switchable live from the palette button

## Admin portal (`/admin`)

| Section | What it does |
| --- | --- |
| Dashboard | Revenue, orders, products and pending reviews; daily revenue chart; low stock; recent orders |
| Products | Search, filter and sort; create, edit, publish/unpublish and delete; image upload and ordering; colors, sizes, features; live preview |
| Categories | Add, rename, recolor and delete (blocked while products use it) |
| Reviews | Approve, reject or delete; approved ratings update the product's average |
| Orders | Filter by status, order detail, change status (cancelling returns items to stock) |
| Settings | Store settings overview and "Reset demo data" |

### Using the admin as a template

- Add a section: add an entry to `nav` in `src/config/admin.ts` and a page in `src/app/admin/(panel)/<name>/page.tsx`
  that starts with `await requireAdmin()`.
- Build pages from `src/components/admin/ui.tsx`: `PageHeader`, `Panel`, `StatCard`, `Table`/`Td`, `Badge`, `Tabs`,
  `EmptyState`, `Notice`. List pages get search and dropdown filters from `FilterBar`, destructive buttons from `ConfirmButton`.
- Put mutations in `src/server/actions/admin.ts` and start each with `await requireAdmin()`; server actions are public endpoints.

## Data and backend

| File | Role |
| --- | --- |
| `src/server/repo.ts` | The only module that reads or writes data. Reimplement it for Postgres, Prisma, Shopify, Medusa... |
| `src/server/db.ts` | JSON file store in `.data/db.json`, seeded from `src/data/*` on first run, atomic serialized writes |
| `src/server/uploads.ts` | Image uploads to `.data/uploads`, served by `/api/uploads/[file]`; type checked from file bytes, 5 MB max, no SVG |
| `src/server/auth.ts` | Single-password admin login with a signed HTTP-only cookie (8 h). Swap for Auth.js or your SSO for multiple users |
| `src/server/actions/store.ts` | Public actions: place order, submit review (validated, honeypot spam check) |

The JSON store suits local use, demos and a single server with a persistent disk. On serverless hosts
(Vercel, Netlify) the file system is read-only or temporary: move `repo.ts` to a database and `uploads.ts`
to object storage (S3, Cloudinary, Vercel Blob) before deploying there.

The checkout is a demo and charges nothing. Connect a payment provider in `placeOrderAction`
(`src/server/actions/store.ts`) and save the order only after the provider confirms payment.

## Environment variables

Create `.env.local`:

```bash
ADMIN_PASSWORD=choose-a-strong-password
ADMIN_SECRET=<32+ random characters>   # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# DATA_DIR=/var/lib/dummy-store        # optional, default ./.data
```

`npm run dev` works without them (password `admin`). `npm start` refuses admin logins until both are set.

## Customize

| File | What it controls |
| --- | --- |
| `src/config/site.ts` | Store name, announcement bar, currency, shipping, tax, coupons, nav, footer |
| `src/config/theme.ts` | Color palettes, default palette and mode, corner radius |
| `src/config/admin.ts` | Admin navigation, low-stock threshold, max images per product |
| `src/app/globals.css` | Light/dark neutral colors, `btn-*`, `card`, `input` styles |
| `src/data/*.ts` | Seed data loaded on first run (delete `.data/` to re-seed) |

To add a palette, append an entry to `palettes` in `theme.ts`; it appears in the switcher automatically.

## Share to another laptop

```bash
npm run share
```

Writes `ecommerce-template-share/` with `setup-ecommerce-template.mjs`, `sync-ecommerce-template.mjs` and
`HOW-TO-SETUP.md`. Each script holds the whole project compressed; see `HOW-TO-SETUP.md` for usage.
The `.data/` folder (your products, orders and uploads) is not included.
