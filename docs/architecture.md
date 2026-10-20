# Architecture

```mermaid
flowchart LR
  subgraph Client["Browser (mobile-first)"]
    UI["Next.js App Router pages<br/>React 19 · Tailwind · shadcn/ui"]
    Store["Zustand cart / wishlist<br/>(localStorage, synced to DB on login)"]
    RQ["TanStack Query<br/>(/api/products, /api/variants)"]
    RZP["Razorpay Checkout.js"]
  end

  subgraph Vercel["Vercel (free tier)"]
    MW["middleware.ts<br/>session refresh · /admin role guard"]
    RSC["Server Components<br/>+ Server Actions (Zod validated)"]
    API["/app/api/*<br/>products · variants · upload · invoice(PDF) · razorpay/webhook"]
    Prisma["Prisma Client"]
  end

  subgraph Supabase["Supabase (free tier)"]
    Auth["Auth<br/>Google OAuth + email/password"]
    PG["PostgreSQL<br/>RLS policies · triggers"]
    Storage["Storage bucket `media`<br/>brands/ products/ videos/ reviews/ settings/"]
  end

  RZPAPI["Razorpay API<br/>orders · webhooks (HMAC)"]
  Resend["Resend (optional)<br/>order & contact emails"]
  YT["YouTube embeds<br/>(hero + product videos)"]

  UI --> MW --> RSC
  UI --> RQ --> API
  UI --> Store
  UI -- signInWithOAuth / password --> Auth
  Auth -- cookie session --> MW
  RSC --> Prisma --> PG
  API --> Prisma
  Auth -- "on_auth_user_created trigger" --> PG
  RSC -- service role --> Storage
  UI -- public URLs --> Storage
  UI --> RZP -- handler(signature) --> RSC
  RSC -- create order --> RZPAPI
  RZPAPI -- webhook payment.captured --> API
  RSC --> Resend
  UI --> YT
```

## Request flow: checkout

```mermaid
sequenceDiagram
  participant C as Customer (browser)
  participant S as Server Action createOrder
  participant DB as Postgres (Prisma)
  participant R as Razorpay
  participant W as /api/razorpay/webhook

  C->>S: items, addressId, paymentMethod
  S->>DB: validate stock & prices, create Order(pending_payment) + Payment
  alt COD
    S->>DB: decrement stock (tx), status=placed
    S-->>C: orderId → /orders/[id]?placed=1
  else Razorpay
    S->>R: orders.create(amount)
    S-->>C: razorpay order id + key
    C->>R: Checkout.js (UPI/cards/netbanking/wallets)
    R-->>C: payment_id + signature
    C->>S: verifyRazorpayPayment (HMAC check)
    S->>DB: finalize (tx): decrement stock, paid, status=placed, history
    R->>W: payment.captured (HMAC check) — idempotent no-op if already finalized
  end
```

## Data model (simplified)

```mermaid
erDiagram
  profiles ||--o{ addresses : has
  profiles ||--o{ orders : places
  profiles ||--o{ reviews : writes
  profiles ||--o{ wishlists : saves
  profiles ||--o| carts : owns
  brands ||--o{ brand_segments : spans
  brands ||--o{ vehicle_models : has
  vehicle_models ||--o{ vehicle_variants : "year × type"
  brands ||--o{ products : sells
  categories ||--o{ products : groups
  products ||--o{ product_images : has
  products ||--o{ product_videos : has
  products ||--o{ product_variant_compat : fits
  vehicle_variants ||--o{ product_variant_compat : fits
  products ||--o{ reviews : receives
  reviews ||--o{ review_images : has
  carts ||--o{ cart_items : contains
  orders ||--o{ order_items : contains
  orders ||--o{ order_status_history : logs
  orders ||--o| payments : paid_by
  contact_messages
  site_settings
```

## Security model

| Layer         | Mechanism                                                                                                                                                                        |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth          | Supabase Auth (Google + email). Session cookies refreshed in `middleware.ts`.                                                                                                    |
| Roles         | `profiles.role` (`customer` / `admin`). Middleware blocks `/admin/*` for non-admins; every admin server action re-checks with `assertAdmin()`.                                   |
| RLS           | Enabled on every table (migration `0002`). Customers see only their own rows; catalogue is public-read, admin-write. Protects direct PostgREST/Storage access with the anon key. |
| Server writes | Prisma runs with the `postgres` role (bypasses RLS) **only inside server code** that performs its own auth checks and Zod validation.                                            |
| Payments      | Razorpay signature verified server-side (checkout HMAC + webhook HMAC). Stock decremented in a DB transaction _after_ verification.                                              |
| Uploads       | Browser → `/api/upload` (auth + folder ACL + MIME/size checks) → Storage via service role.                                                                                       |
| Abuse         | In-memory rate limiting on contact form, uploads, reviews, checkout.                                                                                                             |
| Secrets       | Only `NEXT_PUBLIC_*` values reach the client.                                                                                                                                    |
