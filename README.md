# AtomQuest 2026 — Goal Setting & Tracking Portal

Enterprise OKR portal for Atomberg Technologies. Covers the full lifecycle: goal creation → manager approval → quarterly check-ins → analytics → escalation.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER / CLIENT                         │
│  React 19 · shadcn/ui · TailwindCSS v4 · Recharts · RHF/Zod     │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────────┐
│                    NEXT.JS 16 APP ROUTER                        │
│                                                                 │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────┐   │
│  │  Server Pages   │  │   API Routes     │  │  proxy.ts     │   │
│  │ (RSC — no JS    │  │ (mutations only) │  │ (route guard  │   │
│  │  bundle cost)   │  │ Zod + AuditLog   │  │  by role)     │   │
│  └────────┬────────┘  └────────┬─────────┘  └───────────────┘   │
│           │                   │                                 │
│  ┌────────▼───────────────────▼─────────────────────────────┐   │
│  │                    lib/  (shared logic)                  │   │
│  │  auth · db · score · email · teams · escalation · audit  │   │
│  └────────────────────────┬─────────────────────────────────┘   │
│                           │ @prisma/adapter-pg                  │
│  ┌────────────────────────▼─────────────────────────────────┐   │
│  │              Prisma 7 Client (no binary engine)          │   │
│  └────────────────────────┬─────────────────────────────────┘   │
└───────────────────────────┼─────────────────────────────────────┘
                            │ pg (TLS pool)
             ┌──────────────▼──────────────┐
             │   Supabase — PostgreSQL 15  │
             │   (Transaction Pooler :6543)│
             └─────────────────────────────┘

External services:
  Resend ◄── email notifications (approval / return / escalation)
  MS Teams Webhook ◄── adaptive card notifications
  Vercel Cron ──► /api/cron/escalation  (daily 08:00 UTC)
               ──► /api/cron/checkin-reminder (weekly)
  Microsoft Entra ID ◄──► NextAuth v5 OAuth provider
```

---

## Role & Route Map

```
proxy.ts (route guard)
   │
   ├── /employee/*   → Role: EMPLOYEE
   │     ├── /goals            — list / create goal sheet
   │     ├── /goals/[id]       — edit goals, log actuals
   │     └── /check-ins        — quarterly status view
   │
   ├── /manager/*    → Role: MANAGER | ADMIN
   │     ├── /approvals        — pending sheets queue
   │     ├── /team             — team member management
   │     ├── /check-ins        — add check-in comments
   │     └── /shared-goals     — push KPIs to team
   │
   └── /admin/*      → Role: ADMIN
         ├── /users            — CRUD + assign manager/dept
         ├── /cycles           — goal cycle open/close
         ├── /analytics        — QoQ trends, heatmap
         ├── /escalations      — configure & view rules
         ├── /audit            — paginated mutation log
         └── /reports          — Excel export
```

---

## Tech Stack

| Layer        | Technology                                          |
|--------------|-----------------------------------------------------|
| Framework    | Next.js 16 (App Router, Turbopack)                  |
| Language     | TypeScript 5 (strict)                               |
| Styling      | Tailwind CSS v4 + shadcn/ui v4 + Base UI            |
| Database     | PostgreSQL 15 via Supabase                          |
| ORM          | Prisma 7 (`@prisma/adapter-pg` — no binary engine)  |
| Auth         | NextAuth v5 — Credentials + Microsoft Entra ID      |
| Email        | Resend                                              |
| Teams        | Adaptive Cards via Incoming Webhook                 |
| Charts       | Recharts 3                                          |
| Forms        | React Hook Form + Zod 4                             |
| State        | TanStack Query v5 + Zustand                         |
| Deployment   | Vercel (Fluid Compute + Cron)                       |

---

## Quick Setup

### 1. Install

```bash
cd atomquest
npm install
```

### 2. Environment variables

```env
# Required
DATABASE_URL="postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres"
AUTH_SECRET="<openssl rand -base64 32>"
NEXTAUTH_URL="http://localhost:3000"

# Optional — leave blank to disable the feature
AUTH_MICROSOFT_ENTRA_ID_ID=""
AUTH_MICROSOFT_ENTRA_ID_SECRET=""
AUTH_MICROSOFT_ENTRA_ID_TENANT_ID=""
RESEND_API_KEY=""
TEAMS_WEBHOOK_URL=""
CRON_SECRET=""        # bearer token for Vercel cron routes
```

### 3. Database

```bash
npm run db:push    # push schema (no migration history)
npm run db:seed    # seed demo accounts + active cycle
```

### 4. Dev server

```bash
npm run dev        # http://localhost:3000
```

---

## Demo Accounts

| Role     | Email            | Password    |
|----------|------------------|-------------|
| Admin    | admin@demo.com   | Admin@123   |
| Manager  | manager@demo.com | Manager@123 |
| Employee | emp@demo.com     | Emp@123     |

---

## Feature Summary

**Employee** — create goal sheets (≤8 goals, total weightage = 100 %), submit for approval, log quarterly actuals, view computed scores and lock status.

**Manager** — review/inline-edit submitted sheets, approve (locks goals) or return with note, add check-in comments per quarter, push shared KPIs.

**Admin** — full user/cycle/department management, unlock sheets, audit trail, escalation rule config, analytics dashboard, Excel export.

**Bonus features** — Azure AD SSO, email + Teams notifications, escalation module, analytics dashboard.

---

## Scoring Rules

| UOM Type      | Formula                          | Cap |
|---------------|----------------------------------|-----|
| NUMERIC_MIN   | `actual / target`                | 1.5 |
| NUMERIC_MAX   | `target / actual`                | 1.5 |
| TIMELINE      | `1.0` if on-time, else `0.0`     | —   |
| ZERO          | `1.0` if actual === 0, else `0.0`| —   |

Score stored on every achievement save (`lib/score.ts`). Never recomputed on read.

---

## Commands

```bash
npm run dev           # Turbopack dev server
npm run build         # prisma generate + next build
npm run db:push       # push schema
npm run db:migrate    # named migration
npm run db:seed       # seed demo data
npm run db:studio     # Prisma Studio GUI
npx tsc --noEmit      # type-check
```

---

## Deployment

1. Push to GitHub → import in Vercel
2. Add env vars under **Project → Settings → Environment Variables**
3. `vercel.json` registers daily escalation cron:

```json
{ "crons": [{ "path": "/api/cron/escalation", "schedule": "0 8 * * *" }] }
```

---

## Docs

- [High-Level Design (HLD)](docs/HLD.md)
- [Low-Level Design (LLD)](docs/LLD.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)
