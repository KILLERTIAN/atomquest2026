# AtomQuest 2026 — Goal Setting & Tracking Portal

An enterprise-grade goal management portal built for Atomberg Technologies. Supports Employee, Manager (L1), and Admin roles across a full OKR lifecycle — creation, approval, quarterly check-ins, and reporting.

---

## Tech Stack

| Layer        | Technology                                      |
|--------------|-------------------------------------------------|
| Framework    | Next.js 16 (App Router, Turbopack)              |
| Language     | TypeScript (strict)                             |
| Styling      | Tailwind CSS v4 + shadcn/ui                     |
| Database     | PostgreSQL via Supabase                         |
| ORM          | Prisma 7 (driver adapter: `@prisma/adapter-pg`) |
| Auth         | NextAuth v5 (Credentials + Microsoft Entra ID) |
| Email        | Resend                                          |
| Teams        | Adaptive Cards via Incoming Webhook             |
| Charts       | Recharts                                        |
| Deployment   | Vercel (Fluid Compute + Cron)                   |

---

## Quick Setup

### 1. Clone & install dependencies

```bash
git clone <repo-url> atomquest
cd atomquest
npm install
```

### 2. Configure environment variables

Copy the template and fill in your values:

```bash
cp .env.local.example .env.local   # or edit .env.local directly
```

Required variables:

```env
# Supabase PostgreSQL — use the Transaction Pooler URL (port 6543)
DATABASE_URL="postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres"

# NextAuth — generate with: openssl rand -base64 32
AUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

Optional (leave blank to disable):

```env
# Microsoft Entra ID SSO
AUTH_MICROSOFT_ENTRA_ID_ID=""
AUTH_MICROSOFT_ENTRA_ID_SECRET=""
AUTH_MICROSOFT_ENTRA_ID_TENANT_ID=""

# Email notifications via Resend
RESEND_API_KEY=""

# Microsoft Teams notifications
TEAMS_WEBHOOK_URL=""
```

### 3. Set up the database

```bash
# Push the Prisma schema to your Supabase project (creates all tables)
npm run db:push

# Seed demo users and an active goal cycle
npm run db:seed
```

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Demo Accounts

| Role     | Email               | Password     |
|----------|---------------------|--------------|
| Admin    | admin@demo.com      | Admin@123    |
| Manager  | manager@demo.com    | Manager@123  |
| Employee | emp@demo.com        | Emp@123      |

---

## Core Features

### Employee
- Create goal sheets (max 8 goals, must total exactly 100% weightage)
- Submit for manager approval
- Log quarterly actuals (Q1–Q4) with auto-computed scores
- View lock status and manager feedback

### Manager (L1)
- Review and inline-edit submitted goal sheets
- Approve (locks goals) or Return with note
- Team dashboard with per-goal planned vs actual
- Add structured check-in comments per quarter

### Admin
- Full user management (create, assign manager/department)
- Goal cycle management (open/close dates per phase)
- Push shared KPIs to multiple employees
- Paginated audit trail for every mutation
- Unlock individual goal sheets
- Excel export of all goal data
- Analytics dashboard (QoQ trends, completion heatmap, manager effectiveness)

---

## Useful Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build (prisma generate + next build)
npm run db:push      # Apply schema without migration history
npm run db:migrate   # Create + apply named migration
npm run db:seed      # Seed demo data
npm run db:studio    # Open Prisma Studio GUI
npx tsc --noEmit     # Type-check without building
```

---

## Deployment on Vercel

1. Push to GitHub, import the repo in Vercel
2. Add all env vars under **Project → Settings → Environment Variables**
3. `vercel.json` already configures the daily escalation cron at 08:00 UTC

```json
{
  "crons": [{ "path": "/api/cron/escalation", "schedule": "0 8 * * *" }]
}
```

Set `CRON_SECRET` in Vercel env vars — the cron route validates `Authorization: Bearer <CRON_SECRET>`.

---

## Architecture Notes

- **Server Components** handle all read-heavy pages (no client bundle for data fetching)
- **API routes** handle all mutations + validate with Zod + write to `audit_logs`
- **Prisma 7** uses `@prisma/adapter-pg` — no binary engine, runs cleanly on Vercel Fluid Compute
- **`proxy.ts`** (not `middleware.ts`) — Next.js 16 renamed the file for route protection
- Score is computed once on every achievement save: `NUMERIC_MIN`, `NUMERIC_MAX`, `TIMELINE`, `ZERO` (see `lib/score.ts`)
