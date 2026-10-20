# Anithaarunthadhi — Vehicle Accessories E‑Commerce

Mobile‑first e‑commerce web app for a vehicle accessories store serving **two‑wheelers, four‑wheelers and trucks/commercial vehicles**, with a **Customer** storefront and an **Admin** back‑office.

Built with Next.js 15 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Prisma · PostgreSQL (Supabase) · Supabase Auth (Google + email) · Supabase Storage · Razorpay · Vercel — all on free tiers.

> Architecture diagrams: [`docs/architecture.md`](docs/architecture.md)

---

## Features

**Customer**

- Home: auto‑playing muted looping “Shorts”‑style video hero (uploaded MP4 or YouTube fallback), editable description strip, brand grid with **All | 2 Wheeler | 4 Wheeler | Truck** tabs, sticky WhatsApp button.
- Products: pick a brand → filter by **model, year, segment, vehicle type, category, price, sort**. Products are linked to `vehicle_variants` (brand + model + year + type) so “Hero → Splendor Plus → 2021 → Bike” shows only compatible accessories.
- Product detail: gallery with zoom, MP4/YouTube video, specs table, compatible‑vehicle chips, Markdown description, quantity + Add to cart / Buy now / Wishlist, reviews with rating breakdown (purchasers only, one per product, up to 3 photos), related products, JSON‑LD + Open Graph metadata.
- Cart (persisted locally, merged into the DB on login), wishlist, checkout with saved addresses, **Razorpay** (UPI / cards / net banking / wallets) or **Cash on Delivery**, order confirmation.
- Orders: list + detail with status timeline (Placed → Confirmed → Packed → Shipped → Out for delivery → Delivered / Cancelled / Returned), **PDF invoice**, cancel (while Placed/Confirmed), reorder.
- About (story, mission, gallery, Google Maps embed) and Contact Us (black info panel + underline form, “Ask on WhatsApp”). All content editable in admin Site Settings.

**Admin** (`/admin`, `role = admin` only)

- Dashboard KPIs (today’s orders, revenue, pending, low stock) + recent orders.
- Brands/Models (image upload, sort, active, soft‑delete blocked while products exist), Vehicle Variants (models → bulk year ranges × vehicle type), Products (full CRUD, images, video, dynamic specs, compatibility multi‑select, search/filter/pagination, bulk activate/deactivate, **CSV import/export**), Orders (filters, detail, status dropdown with history + customer email, courier/tracking, refund marking), Customers (order count, spend), Reviews moderation, Contact inbox (read/unread), Site Settings.

---

## 1. Prerequisites

- Node.js ≥ 20 and **pnpm** (`npm i -g pnpm`)
- A free **Supabase** account, a free **Razorpay** account (test mode), a **Google Cloud** project (for OAuth)
- Optional: **Resend** account for emails (otherwise emails are logged to the console)

## 2. Create the Supabase project

1. Go to <https://supabase.com/dashboard> → **New project** (free tier). Pick a region near your users (e.g. Mumbai `ap-south-1`) and save the database password.
2. **Project Settings → API**: copy `Project URL`, `anon public` key and `service_role` key.
3. **Project Settings → Database → Connection string → URI**:
   - Transaction pooler (port **6543**) → `DATABASE_URL` (append `?pgbouncer=true&connection_limit=1`)
   - Session pooler / direct (port **5432**) → `DIRECT_URL`
4. **Authentication → URL Configuration**: set _Site URL_ to `http://localhost:3000` (later your Vercel URL) and add `http://localhost:3000/auth/callback` and `https://<your-domain>/auth/callback` to _Redirect URLs_.
5. **Authentication → Providers → Email**: keep enabled. (Optionally disable “Confirm email” for faster local testing.)

## 3. Enable Google OAuth

1. <https://console.cloud.google.com/> → create/select a project → **APIs & Services → OAuth consent screen** (External, add your email as test user).
2. **Credentials → Create credentials → OAuth client ID → Web application**.
   - Authorized JavaScript origins: `http://localhost:3000`, `https://<your-domain>`
   - Authorized redirect URI: `https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback`
3. Copy the Client ID / Secret into **Supabase → Authentication → Providers → Google** and enable it.

## 4. Razorpay test keys

1. <https://dashboard.razorpay.com/> → switch to **Test Mode** → **Settings → API Keys → Generate Test Key**. Copy `Key Id` → `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `Key Secret` → `RAZORPAY_KEY_SECRET`.
2. **Settings → Webhooks → Add**: URL `https://<your-domain>/api/razorpay/webhook`, choose a secret → `RAZORPAY_WEBHOOK_SECRET`, events `payment.captured`, `payment.failed`, `order.paid`. (For local testing use a tunnel such as `npx localtunnel --port 3000`, or skip the webhook — the client‑side verification path also finalizes orders.)
3. Test cards/UPI: <https://razorpay.com/docs/payments/payments/test-card-details/>

## 5. Configure environment

```bash
cp .env.example .env
# fill in every value (see comments inside)
```

## 6. Install, migrate, seed, run

```bash
pnpm install
pnpm db:migrate          # prisma migrate deploy → creates tables, RLS, triggers, storage bucket
pnpm db:seed             # brands (2W/4W/truck), models, variants, categories, 30 products, admin + customer
pnpm dev                 # http://localhost:3000
```

The seed creates two auth users (if `SUPABASE_SERVICE_ROLE_KEY` is set):

| Role     | Email                            | Password         |
| -------- | -------------------------------- | ---------------- |
| Admin    | `admin@anithaarunthadhi.test`    | `Admin@12345`    |
| Customer | `customer@anithaarunthadhi.test` | `Customer@12345` |

(Override with `SEED_*` env vars. The customer already has one delivered order so you can test posting a review.)

### Making a user an admin

Admins are created **manually in the database**. In Supabase → **Table Editor → `profiles`** (or the SQL editor):

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

Sign out and back in; you will be routed to `/admin`. `middleware.ts` blocks `/admin/*` for anyone else and every admin server action re‑checks the role.

> **Note on migrations:** `0002_rls_auth_storage` contains Supabase‑specific SQL (FK to `auth.users`, RLS policies, storage bucket). Use `pnpm db:migrate` (`prisma migrate deploy`). If you use `prisma migrate dev` against a plain local Postgres, the `auth`/`storage` blocks are skipped automatically.

### Local alternative: Postgres in Docker (no Supabase yet)

You can develop the catalogue/admin/checkout(COD) flows against a local Postgres before creating a Supabase project (auth pages will show but sign‑in requires Supabase):

```bash
docker run -d --name an-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=anithaarunthadhi -p 54329:5432 postgres:16-alpine
# .env
DATABASE_URL="postgresql://postgres:postgres@localhost:54329/anithaarunthadhi"
DIRECT_URL="postgresql://postgres:postgres@localhost:54329/anithaarunthadhi"
pnpm db:migrate && pnpm db:seed && pnpm dev
```

Migration `0002` detects the missing `auth`/`storage` schemas and stubs `auth.uid()` so the RLS policies still apply; profiles are seeded with fixed UUIDs.

## 7. Scripts

| Command                                                                       | What it does                                                                                                                          |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm dev` / `pnpm build` / `pnpm start`                                      | Next.js dev / production build / serve                                                                                                |
| `pnpm typecheck` · `pnpm lint` · `pnpm format`                                | TypeScript, ESLint, Prettier                                                                                                          |
| `pnpm db:migrate` · `pnpm db:migrate:dev` · `pnpm db:seed` · `pnpm db:studio` | Prisma                                                                                                                                |
| `pnpm test`                                                                   | Vitest unit tests (pricing, order state machine, utils)                                                                               |
| `pnpm test:e2e`                                                               | Playwright: login → add to cart → checkout → admin updates status (set `E2E_RAZORPAY=1` to pay via Razorpay test mode instead of COD) |

## 8. Deploy to Vercel

1. Push the repo to GitHub and import it at <https://vercel.com/new> (Hobby/free).
2. Framework preset: Next.js. Build command: `pnpm build` (runs `prisma generate`). Install command: `pnpm install`.
3. Add **all** variables from `.env.example` under _Environment Variables_. Set `NEXT_PUBLIC_APP_URL=https://<your-vercel-domain>`.
4. Deploy. Then:
   - Supabase → Auth → URL configuration: add the Vercel URL + `/auth/callback`.
   - Google OAuth client: add the Vercel origin.
   - Razorpay webhook: point to `https://<your-vercel-domain>/api/razorpay/webhook`.
5. Run migrations against production once from your machine: `pnpm db:migrate && pnpm db:seed` (with the production `.env`).

(Netlify works too via the official Next.js runtime — same env vars.)

## 9. Project structure

```
prisma/               schema.prisma, migrations (0001 tables · 0002 RLS/auth/storage), seed.ts
src/app/
  (customer)/         home, products, products/[slug], cart, wishlist, checkout, orders, about, contact, profile
  (auth)/             login, signup      auth/callback · auth/redirect · auth/signout
  admin/              dashboard, brands, variants, products, orders, customers, reviews, messages, settings
  api/                products · variants · upload · orders/[id]/invoice · razorpay/webhook · admin/products/export
src/actions/          server actions (Zod‑validated): cart, wishlist, orders, admin-orders, products, brands, variants, reviews, messages, settings, profile
src/lib/              prisma, supabase clients, auth, settings, pricing, order-status, razorpay, email, rate-limit, pdf/invoice, validations
src/components/       ui (shadcn), layout, home, products, cart, checkout, orders, admin, contact, shared
src/store/            zustand cart + wishlist (persisted)
tests/unit · tests/e2e
docs/architecture.md
```

## 10. Notes & assumptions

- **Rich text** for product descriptions / about content is **Markdown** (rendered safely with `react-markdown`, raw HTML disabled).
- Reviews are visible immediately (`approved`) and admins can hide/delete them; only customers with a paid/delivered order for the product can review.
- Stock is decremented **inside a DB transaction only after payment verification** (Razorpay) or immediately for COD; cancellations restock.
- Rate limiting is in‑memory per instance (fine for a small store); swap `src/lib/rate-limit.ts` for Upstash Redis if you scale out.
- Videos: upload MP4 to Storage (50 MB cap) or paste a YouTube link to save the 1 GB free quota.
- Brands that span segments (Honda, BMW) are a single brand with multiple `brand_segments`; “Tata” (cars) and “Tata Motors” (trucks) are separate brands as named in the brief.
