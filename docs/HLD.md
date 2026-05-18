# High-Level Design (HLD)

## 1. System Overview

AtomQuest is a multi-tenant, role-based OKR (Objective & Key Results) portal. It replaces manual spreadsheet-based goal tracking with a structured digital workflow covering creation → approval → quarterly tracking → analytics.

---

## 2. System Context Diagram

```
                        ┌──────────────────────────────┐
                        │        ATOMQUEST PORTAL       │
                        │       (Vercel — global CDN)   │
┌──────────┐  HTTPS     │                              │
│ Employee │───────────►│  Next.js 16 App Router        │
└──────────┘            │  (RSC + Server Actions +      │
┌──────────┐  HTTPS     │   API Routes)                 │
│ Manager  │───────────►│                              │
└──────────┘            │         │          │          │
┌──────────┐  HTTPS     │     Prisma 7    NextAuth v5   │
│  Admin   │───────────►│         │          │          │
└──────────┘            └─────────┼──────────┼──────────┘
                                  │          │
                    ┌─────────────▼──┐  ┌────▼─────────────┐
                    │ Supabase       │  │ Microsoft         │
                    │ PostgreSQL 15  │  │ Entra ID (OAuth)  │
                    └────────────────┘  └───────────────────┘
                                  │
                    ┌─────────────▼─────────────────────────┐
                    │  External Notification Services        │
                    │  • Resend (transactional email)        │
                    │  • MS Teams Incoming Webhook           │
                    └───────────────────────────────────────┘
                                  ▲
                    ┌─────────────┴─────────────────────────┐
                    │  Vercel Cron Jobs                      │
                    │  • /api/cron/escalation  (daily 08:00) │
                    │  • /api/cron/checkin-reminder (weekly) │
                    └───────────────────────────────────────┘
```

---

## 3. Component Architecture

```
┌──────────────────────── Next.js App Router ─────────────────────┐
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │  Presentation Layer (React 19 + shadcn/ui)                │   │
│  │                                                           │   │
│  │  Server Components (RSC)   │  Client Components           │   │
│  │  ─────────────────────     │  ──────────────────          │   │
│  │  • Page layouts            │  • GoalSheetForm             │   │
│  │  • Data-heavy list views   │  • CheckInClient             │   │
│  │  • Analytics dashboard     │  • TeamTableClient           │   │
│  │  • Audit log               │  • Charts (Recharts)         │   │
│  │                            │  • SettingsClient            │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │  API / Mutation Layer                                     │   │
│  │                                                           │   │
│  │  /api/goals/*         /api/goal-sheets/*                  │   │
│  │  /api/users/*         /api/cycles/*                       │   │
│  │  /api/check-ins/*     /api/shared-goals/*                 │   │
│  │  /api/notifications/* /api/analytics/*                    │   │
│  │  /api/reports/export  /api/invites/*                      │   │
│  │  /api/auth/*          /api/cron/*                         │   │
│  │                                                           │   │
│  │  All routes: Zod validate → DB write → logAudit()         │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │  Service Layer (lib/)                                     │   │
│  │                                                           │   │
│  │  auth.ts        — NextAuth config, session helpers        │   │
│  │  db.ts          — Prisma client singleton (adapter-pg)    │   │
│  │  score.ts       — UOM scoring formulas                    │   │
│  │  email.ts       — Resend wrappers                         │   │
│  │  teams.ts       — Adaptive Card webhook sender            │   │
│  │  escalation.ts  — Rule evaluation + event creation        │   │
│  │  audit.ts       — logAudit() utility                      │   │
│  │  notify.ts      — unified notification dispatch           │   │
│  │  validations.ts — shared Zod schemas                      │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  proxy.ts — route guard (replaces middleware.ts in Next.js 16)   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. Authentication & Authorization Flow

```
Request → proxy.ts
             │
             ├─ No session? → redirect /login
             │
             ├─ /employee/* + role != EMPLOYEE? → 403
             ├─ /manager/* + role not in {MANAGER, ADMIN}? → 403
             └─ /admin/*   + role != ADMIN? → 403

Login options:
  ┌─────────────────────────────────────┐
  │  NextAuth v5                         │
  │                                      │
  │  CredentialsProvider                 │
  │    email + password (bcryptjs hash)  │
  │    → User.passwordHash               │
  │                                      │
  │  MicrosoftEntraIDProvider            │
  │    OAuth 2.0 PKCE                    │
  │    → User.azureId                    │
  └─────────────────────────────────────┘
```

---

## 5. Goal Lifecycle State Machine

```
                ┌─────────┐
                │  DRAFT  │ ◄──── employee edits, adds goals
                └────┬────┘
                     │ submit (weightage = 100%)
                ┌────▼────┐
                │SUBMITTED│ ──── manager notified (email + Teams)
                └────┬────┘
              ┌──────┴──────┐
        approve             return (with note)
              │             │
         ┌────▼────┐   ┌────▼────┐
         │APPROVED │   │RETURNED │ ──── employee notified
         │(locked) │   └────┬────┘
         └────┬────┘        │ employee re-edits → DRAFT
              │
              ▼ quarterly actuals logged (Q1–Q4)
         computedScore stored per GoalAchievement
              │
              ▼ Admin can unlock (isLocked = false) → edit → re-approve
```

---

## 6. Notification Architecture

```
Mutation (API route)
        │
        ▼
  notify.ts (unified dispatcher)
        │
        ├──► lib/email.ts ──► Resend API ──► Inbox
        │
        └──► lib/teams.ts ──► MS Teams Webhook ──► Channel
                │
                └── Notification record written to DB
                    (shown in-app notification bell)
```

Triggers:
- Sheet submitted → manager email + Teams card
- Sheet approved / returned → employee email + Teams card
- Escalation fired → admin email + Teams card
- Check-in reminder → employee email (weekly cron)

---

## 7. Escalation Module

```
Vercel Cron (daily 08:00 UTC)
        │
        ▼
/api/cron/escalation
        │
        ▼
lib/escalation.ts
  for each active EscalationRule:
    ├── SUBMISSION trigger → find sheets in DRAFT older than daysThreshold
    ├── APPROVAL trigger   → find sheets in SUBMITTED older than daysThreshold
    └── CHECKIN trigger    → find sheets with no check-in in current quarter
              │
              ▼
    Create EscalationEvent (unless already open for that entity)
              │
              ▼
    notify admin via email + Teams
```

---

## 8. Shared Goals Flow

```
Admin pushes shared KPI:
  1. POST /api/shared-goals { goalId, employeeIds[] }
  2. For each employee: copy Goal record with primaryGoalId = source goal ID
  3. Recipient sees goal with isShared = true (title/target read-only)
  4. Actuals logged independently per recipient
  5. Manager reviews each recipient's actual vs target separately
```

---

## 9. Analytics Data Flow

```
/admin/analytics (Server Component)
        │
        ▼
GET /api/analytics
        │
        ▼
Prisma aggregation queries:
  • GoalAchievement grouped by quarter → QoQ trend (line chart)
  • GoalAchievement grouped by dept + status → completion heatmap
  • GoalSheet approval times → manager effectiveness (bar chart)
  • Top-scoring goals → leaderboard
        │
        ▼
Recharts components render in browser
```

---

## 10. Deployment Architecture

```
GitHub
  └── Vercel CI/CD
        ├── Preview deploys (per PR)
        └── Production deploy
              │
              ├── Fluid Compute (serverless, auto-scale)
              ├── Edge Network (CDN for static assets)
              └── Cron Jobs
                    ├── /api/cron/escalation        (0 8 * * *)
                    └── /api/cron/checkin-reminder  (custom schedule)

Supabase:
  └── PostgreSQL 15 (managed)
        └── Transaction Pooler (port 6543) — prevents connection exhaustion
```

---

## 11. Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| RSC for reads | Server Components | Zero client JS for data fetching; faster TTFB |
| Prisma 7 adapter | `@prisma/adapter-pg` | No binary engine → runs on Vercel Fluid Compute |
| `proxy.ts` not `middleware.ts` | Next.js 16 rename | File renamed; old name is a runtime error |
| Shared Zod schemas | `lib/validations.ts` | Single source of truth for client + server validation |
| Score stored on write | `GoalAchievement.computedScore` | No recompute on every read; consistent historical data |
| Notifications dual-channel | Email + Teams | Reaches users in both mediums; graceful degradation if one is unconfigured |
