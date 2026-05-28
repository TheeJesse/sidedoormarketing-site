# This Is Our Town — Claude Code Session Guide

## What this project is

A local skill-and-service barter exchange platform called **"This Is Our Town"** (full brand) / **"Our Town"** (nav/compact UI). Users list what they offer and need, browse neighbors, and get matched for trades.

Live URL: `sidedoormarketing-site.vercel.app`
Repo: `theejesse/sidedoormarketing-site`
Dev branch convention: create a new `claude/<feature-name>` branch for each feature

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 App Router (TypeScript) |
| Styling | Tailwind CSS with custom tokens (see below) |
| ORM | Prisma 5 with PostgreSQL |
| DB | Supabase (hosted Postgres) |
| Auth | NextAuth.js v4, credentials provider, JWT |
| Storage | Supabase Storage (`avatars` bucket) for profile photos |
| Hosting | Vercel (root dir: `our-town`, branch: `main`) |

### Tailwind color tokens
- `brand-*` — green (primary action color, e.g. `brand-500 = #4a9a38`)
- `earth-*` — warm gray/brown (text, borders)
- `bark-*` — cream/tan (backgrounds, secondary borders)

---

## Project structure (inside `our-town/`)

```
prisma/
  schema.prisma       # DB models — edit here, then run SQL manually in Supabase
  seed.ts             # Demo data (26 categories, 4 users)
src/
  app/
    page.tsx                   # Landing page
    browse/page.tsx            # Browse traders (client, filters)
    pricing/page.tsx           # Pricing tiers (client, billing toggle)
    dashboard/page.tsx         # User dashboard (profile/offers/needs tabs)
    matches/page.tsx           # Match suggestions
    profile/[id]/page.tsx      # Public profile view
    admin/page.tsx             # Admin panel
    auth/
      login/page.tsx
      signup/page.tsx
    api/
      users/route.ts           # GET (browse) / POST (signup)
      users/[id]/route.ts      # GET / PATCH / DELETE
      users/[id]/photo/route.ts # POST photo upload → Supabase Storage
      matches/route.ts         # GET top matches for session user
      categories/route.ts      # GET all categories
  components/
    layout/
      Navbar.tsx               # Sticky top nav, session-aware
      Footer.tsx               # Brand footer
    ui/
      Avatar.tsx               # Initials fallback if no photo
      AvatarUpload.tsx         # Clickable avatar upload (profile page)
      Button.tsx
      Input.tsx
      Badge.tsx
    browse/
      UserCard.tsx             # Card shown in browse grid
  lib/
    prisma.ts                  # Prisma client singleton
    auth.ts                    # NextAuth config
    matching.ts                # Match scoring engine
    supabase.ts                # Supabase admin client (server-side only)
```

---

## DB schema — key models

```prisma
User {
  id, name, email, passwordHash
  city, state, zip, bio, profilePhoto, radius
  contactMethod, contactValue    // "email" | "phone"
  isApproved, isHidden, isAdmin
  plan                           // NOT YET IN SCHEMA — add for Stripe
  stripeCustomerId               // NOT YET IN SCHEMA — add for Stripe
  stripeSubscriptionId           // NOT YET IN SCHEMA — add for Stripe
}

Category { id, name, icon }
Offer    { id, userId, title, categoryId, description }
Need     { id, userId, title, categoryId, description }
Review   { id, userId, badgeType, note }
Match    { id, userAId, userBId, overlapReason, matchScore }
```

---

## Critical constraints — do not break these

1. **No `directUrl` in `prisma/schema.prisma`** — Vercel builds fail if it's present because `DIRECT_DATABASE_URL` is not set. Schema is:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. **No `prisma db push` in the build script** — `vercel-build` in `package.json` must be:
   ```
   prisma generate && next build
   ```
   Running `db push` during Vercel builds hangs on the Supabase pooler (port 6543).

3. **Schema changes = manual SQL** — When you add fields (e.g. `plan`, `stripeCustomerId`), write the `ALTER TABLE` SQL and tell the user to run it in the **Supabase SQL Editor** (supabase.com → project → SQL Editor).

4. **All API routes need `export const dynamic = "force-dynamic"`** — prevents Next.js build-time prerendering from crashing on DB calls.

5. **Supabase service role key is server-side only** — never import `supabase.ts` in client components. The `SUPABASE_SERVICE_ROLE_KEY` env var is never in `.env.local` for safety.

6. **`Cache-Control: no-store`** on the `/api/users` GET response, and `cache: 'no-store'` in the client fetch — prevents Vercel edge caching stale user lists.

---

## Environment variables (Vercel — set for Production + Preview)

| Key | Value |
|---|---|
| `DATABASE_URL` | Supabase pooler connection string (port 6543) |
| `NEXTAUTH_SECRET` | Random secret string |
| `NEXTAUTH_URL` | `https://sidedoormarketing-site.vercel.app` |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `STRIPE_SECRET_KEY` | *(to add)* Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | *(to add)* Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | *(to add)* Stripe publishable key (client-safe) |

---

## What's built and working

- [x] Landing page with recent traders
- [x] Sign up / log in (NextAuth credentials)
- [x] Browse with keyword / city / category filters
- [x] User profiles (public + own with edit)
- [x] Offers & needs (CRUD via dashboard)
- [x] Profile photo upload (Supabase Storage)
- [x] Match engine (keyword + category scoring)
- [x] Pricing page (`/pricing`) — 3 tiers, billing toggle, FAQ
- [x] Navbar + Footer with Pricing link
- [x] Admin panel (`/admin`)

---

## Next feature: Stripe Integration

### Goal
Wire the pricing page CTAs to real Stripe Checkout. When payment succeeds, flip `user.plan` in the DB to unlock features.

### Step-by-step build plan

#### 1. Stripe setup (user does this in Stripe dashboard)
- Create 3 products: Free (no payment), Neighbor, Pro
- Create prices: Neighbor monthly ($9), Neighbor annual ($84), Pro monthly ($29), Pro annual ($276)
- Note the Price IDs (e.g. `price_xxx`) — you'll hardcode them

#### 2. Install Stripe SDK
```bash
npm install stripe @stripe/stripe-js
```

#### 3. Add DB fields (write SQL for user to run in Supabase SQL Editor)
```sql
ALTER TABLE "User"
  ADD COLUMN "plan" TEXT NOT NULL DEFAULT 'free',
  ADD COLUMN "stripeCustomerId" TEXT,
  ADD COLUMN "stripeSubscriptionId" TEXT;
```
Also update `prisma/schema.prisma` to match (no db push needed — schema is for Prisma client generation only).

#### 4. Create checkout API route
`src/app/api/stripe/checkout/route.ts` — POST, accepts `{ planId, billing }`, creates a Stripe Checkout session, returns `{ url }`. Redirect user to Stripe-hosted checkout page.

#### 5. Create webhook API route
`src/app/api/stripe/webhook/route.ts` — POST, validates Stripe signature, handles:
- `checkout.session.completed` → set `user.plan = 'neighbor' | 'pro'`, save `stripeCustomerId` + `stripeSubscriptionId`
- `customer.subscription.deleted` → set `user.plan = 'free'`

Must use `export const dynamic = "force-dynamic"` and read raw body (not `req.json()`).

#### 6. Wire pricing page CTAs
Change the "Start trading" / "Go Pro" buttons to POST to `/api/stripe/checkout` instead of linking to `/auth/signup`. Redirect to returned `url`.

#### 7. Customer portal route
`src/app/api/stripe/portal/route.ts` — POST, creates a Stripe Billing Portal session so users can cancel/update from their dashboard.

#### 8. Gate features
Check `session.user.plan` (extend NextAuth session type to include it):
- Free → cap at 5 offers + 5 needs (enforce in PATCH/POST offer/need routes)
- Neighbor → show "Trusted Neighbor" badge on profile + browse cards
- Pro → surface first in browse orderBy (priority flag or sort by plan tier)

### Price ID map (fill in after Stripe setup)
```ts
const PRICE_IDS = {
  neighbor_monthly: 'price_xxx',
  neighbor_annual:  'price_xxx',
  pro_monthly:      'price_xxx',
  pro_annual:       'price_xxx',
}
```

---

## After Stripe — build order

1. **Verified badge UI** — show badge on `UserCard` and profile page for `plan !== 'free'`
2. **Featured placement** — `orderBy: [{ plan: 'desc' }, { createdAt: 'desc' }]` in browse API (Pro > Neighbor > Free)
3. **Match limit** — track matches used this month, cap free users at 3
4. **Upgrade prompts** — modal when free user hits a limit, link to `/pricing`

---

## Demo credentials (for testing)

| Email | Password | Notes |
|---|---|---|
| jesse@demo.com | demo1234 | Admin user |
| maria@demo.com | demo1234 | Regular user |
| bob@demo.com | demo1234 | Regular user |
| lisa@demo.com | demo1234 | Regular user |
