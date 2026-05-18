<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js / Prisma you know

This project runs **Next.js 16**, **Prisma 7**, and **shadcn v4** — all with breaking changes. Read the notes below before writing any code.
<!-- END:nextjs-agent-rules -->

---

## Project Structure & Architecture

```
app/(auth)/          — unauthenticated pages (login)
app/(app)/           — role-protected shell (sidebar + header)
  employee/          — goal creation, check-ins
  manager/           — approvals, team dashboard, comments
  admin/             — users, cycles, audit, analytics, escalations
app/api/             — API route handlers (mutations only; reads use server components)
components/goals/    — GoalSheetForm, WeightageBar (shared client components)
lib/                 — db, auth, score, email, teams, escalation, validations, audit
prisma/              — schema.prisma, seed.ts, prisma.config.ts (v7 config file)
proxy.ts             — route guard (replaces middleware.ts — Next.js 16 renamed it)
```

---

## Breaking-Change Notes

### Next.js 16
- **`middleware.ts` is now `proxy.ts`** — the file was renamed; the old name is an error.
- Route handler params are `ctx: { params: Promise<Record<string, string>> }` — always `await ctx.params`.
- `RouteContext<'/path'>` is only available after running `next typegen`; don't rely on it.

### Prisma 7
- **No `url` or `directUrl` in `schema.prisma` datasource** — connection config lives only in `prisma.config.ts`.
- **`new PrismaClient()` requires a driver adapter** — the library/binary engine was removed. Use `@prisma/adapter-pg` (already wired in `lib/db.ts`).
- `updateMany` does **not** accept a `select` option.

### shadcn v4 / Base UI
- **`asChild` is not supported** — use `buttonVariants({ variant })` as `className` on a `<Link>`, or apply styles directly to the trigger element.
- `Select` `onValueChange` callback receives `string | null` — guard with `if (v)` before using.
- `DialogTrigger` renders as a native button; no need to wrap it in `<Button>`.

---

## Build & Development Commands

```bash
npm run dev          # dev server (Turbopack)
npm run build        # prisma generate + next build
npm run db:push      # push schema to DB without migration history
npm run db:migrate   # create and apply a named migration
npm run db:seed      # seed demo users + active cycle
npm run db:studio    # open Prisma Studio
npx tsc --noEmit     # type-check without building
```

---

## Database Setup (first-time)

1. Create a Supabase project → copy the **Transaction pooler** URL (port 6543).
2. Paste it into `.env.local` as `DATABASE_URL`.
3. `npm run db:push` — pushes the schema.
4. `npm run db:seed` — creates demo accounts:
   - admin@demo.com / Admin@123
   - manager@demo.com / Manager@123
   - emp@demo.com / Emp@123

---

## Key Domain Rules

- **Weightage**: sum across goals in a sheet must equal exactly 100%; minimum 10% per goal; max 8 goals.
- **Locking**: goals are locked (`isLocked = true`) on manager approval. Only Admin can unlock.
- **Shared goals**: recipients may only change weightage; title/target are read-only; achievements sync from the primary owner's goal.
- **Score formula** (stored on every achievement save, never recomputed on read):
  - `NUMERIC_MIN` → `min(actual/target, 1.5)`
  - `NUMERIC_MAX` → `min(target/actual, 1.5)`
  - `TIMELINE` → `1.0` if completed ≤ deadline, else `0.0`
  - `ZERO` → `1.0` if actual === 0, else `0.0`

---

## Coding Style

- TypeScript strict mode enabled.
- Tailwind for all styling — no CSS files except `globals.css`.
- Zod schemas in `lib/validations.ts` are shared between client and server — import from there, don't duplicate.
- API routes validate with Zod and call `logAudit()` for every mutation.
- Server components fetch data directly via `db.*`; client components use `fetch` against API routes.
