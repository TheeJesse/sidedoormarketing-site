# This Is Our Town — Setup Guide

## Phase 3: Setup & Deployment

---

## Local Development

### 1. Prerequisites
- Node.js 18+
- A PostgreSQL database (Supabase free tier recommended)
- npm

### 2. Clone and install

```bash
cd our-town
npm install
```

### 3. Environment variables

Copy the example file:
```bash
cp .env.example .env
```

Fill in `.env`:

```env
# Get from Supabase: Settings > Database > Connection string (URI)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"

# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-random-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Push schema and seed database

```bash
npm run db:push       # Push schema to Supabase
npm run db:generate   # Generate Prisma client
npm run db:seed       # Seed demo profiles (Jesse, Maria, Bob, Lisa)
```

### 5. Start the dev server

```bash
npm run dev
```

Open http://localhost:3000

---

## Demo Accounts

| User | Email | Password | Notes |
|------|-------|----------|-------|
| Jesse | jesse@demo.com | demo1234 | Full profile, 12 offers, 8 needs |
| Maria | maria@demo.com | demo1234 | Massage therapist |
| Bob | bob@demo.com | demo1234 | Mobile mechanic |
| Lisa | lisa@demo.com | demo1234 | Electrician |

To make Jesse an admin:
```sql
UPDATE "User" SET "isAdmin" = true WHERE email = 'jesse@demo.com';
```
Or via Prisma Studio:
```bash
npm run db:studio
```

---

## Pages Reference

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/browse` | Directory with search/filter |
| `/profile/[id]` | Public profile page |
| `/auth/signup` | 4-step onboarding |
| `/auth/login` | Login |
| `/dashboard` | Edit profile, manage offers/needs |
| `/matches` | Barter match suggestions |
| `/admin` | Admin panel (admin users only) |

---

## Deployment (Vercel)

### 1. Push to GitHub
```bash
git add our-town
git commit -m "Add This Is Our Town MVP"
git push
```

### 2. Create Vercel project
- Go to vercel.com → New Project
- Import your repo, set **Root Directory** to `our-town`

### 3. Add environment variables in Vercel
```
DATABASE_URL=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://your-app.vercel.app
```

### 4. Deploy
Vercel auto-deploys on push to main.

After first deploy, seed the database:
```bash
# Locally with production DATABASE_URL
DATABASE_URL="..." npm run db:seed
```

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| ORM | Prisma |
| Database | PostgreSQL (Supabase) |
| Auth | NextAuth.js (credentials) |
| Deployment | Vercel |

---

## Next Feature Recommendations

### Phase 2 (Quick wins)
- [ ] Profile photo upload via Supabase Storage
- [ ] Google OAuth login option
- [ ] Email notification on match
- [ ] Category icons in browse filter

### Phase 3 (Growth)
- [ ] In-app messaging thread
- [ ] Trade review / rating system
- [ ] Verified local badge (manual admin approval)
- [ ] Map view (Mapbox or Google Maps)
- [ ] SMS notifications (Twilio)

### Phase 4 (Platform)
- [ ] Barter credits / points system
- [ ] Business/organization accounts
- [ ] AI smart matching upgrade (semantic similarity)
- [ ] Community events / meetups
- [ ] Mobile app (React Native)

---

## Naming Conventions Used

| Context | Name |
|---------|------|
| Hero, metadata, major brand moments | **This Is Our Town** |
| Nav, dashboard, compact headers, mobile | **Our Town** |
