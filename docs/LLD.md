# Low-Level Design (LLD)

## 1. Module Breakdown

### lib/db.ts
Prisma singleton using `@prisma/adapter-pg`. Connection string read from `prisma.config.ts` (Prisma 7 — not in `schema.prisma`). Exports `db` for use in server components and API routes.

### lib/auth.ts
NextAuth v5 config. Providers: `CredentialsProvider` (bcryptjs hash check) + `MicrosoftEntraIDProvider`. Session strategy: JWT. Callbacks extend the session token with `user.id`, `user.role`.

### lib/score.ts
```ts
computeScore(uomType, targetValue, actualValue, targetDate, actualDate): number

NUMERIC_MIN  → min(actual / target, 1.5)
NUMERIC_MAX  → min(target / actual, 1.5)
TIMELINE     → actualDate <= targetDate ? 1.0 : 0.0
ZERO         → actual === 0 ? 1.0 : 0.0
```
Called inside `PUT /api/achievements/[goalId]` and stored in `GoalAchievement.computedScore`.

### lib/email.ts
Wraps Resend SDK. Templates rendered as JSX or string. Functions:
- `sendGoalSubmittedEmail(manager, employee, sheetId)`
- `sendApprovalEmail(employee, sheetId, status, note?)`
- `sendEscalationEmail(admin, details)`
- `sendCheckinReminderEmail(employee)`
- `sendInviteEmail(email, inviteToken)`
- `sendPasswordResetEmail(email, resetToken)`

### lib/teams.ts
Posts Adaptive Card JSON to `TEAMS_WEBHOOK_URL`. Same triggers as email. Gracefully no-ops when `TEAMS_WEBHOOK_URL` is unset.

### lib/notify.ts
Unified dispatcher. Writes `Notification` record to DB + calls `email.ts` + `teams.ts`. All notification calls go through here.

### lib/escalation.ts
`runEscalationCheck()` — called by cron route:
1. Load all active `EscalationRule` records
2. For each rule, query entities matching trigger type + age threshold
3. Skip if an open `EscalationEvent` already exists for that entity
4. Create `EscalationEvent` + call `notify.ts`

### lib/audit.ts
```ts
logAudit(ctx: {
  entityType: string
  entityId: string
  action: string
  oldValue?: object
  newValue?: object
  changedById: string
})
```
Called at the end of every API route mutation.

### lib/validations.ts
Zod schemas imported by both API routes (server validation) and React Hook Form (client validation):
- `goalSchema` — title, thrust area, uomType, targetValue, weightage
- `goalSheetSubmitSchema`
- `userSchema`
- `cycleSchema`
- `checkinSchema`
- `escalationRuleSchema`

---

## 2. API Routes Reference

### Goals

| Method | Path | Auth | Action |
|--------|------|------|--------|
| GET | `/api/goals` | Employee | List own goals for active cycle |
| POST | `/api/goals` | Employee | Create goal in draft sheet |
| GET | `/api/goals/[id]` | Employee/Manager | Get single goal + achievements |
| PUT | `/api/goals/[id]` | Employee/Manager | Update goal fields |
| DELETE | `/api/goals/[id]` | Employee | Delete goal (only DRAFT sheet) |
| POST | `/api/goals/[id]/submit` | Employee | Submit goal sheet |

### Goal Sheets

| Method | Path | Auth | Action |
|--------|------|------|--------|
| POST | `/api/goal-sheets/[id]/approve` | Manager | Approve sheet, lock goals |
| POST | `/api/goal-sheets/[id]/return` | Manager | Return sheet with note |
| POST | `/api/goal-sheets/[id]/unlock` | Admin | Unlock goals for editing |

### Achievements

| Method | Path | Auth | Action |
|--------|------|------|--------|
| PUT | `/api/achievements/[goalId]` | Employee | Upsert quarterly actual + compute score |

### Check-ins

| Method | Path | Auth | Action |
|--------|------|------|--------|
| GET | `/api/check-ins` | Manager | List team check-ins for quarter |
| POST | `/api/check-ins` | Manager | Add check-in comment |

### Users

| Method | Path | Auth | Action |
|--------|------|------|--------|
| GET | `/api/users` | Admin | Paginated user list |
| POST | `/api/users` | Admin | Create user |
| PUT | `/api/users/[id]` | Admin | Update user (role, manager, dept) |
| DELETE | `/api/users/[id]` | Admin | Deactivate user |

### Cycles

| Method | Path | Auth | Action |
|--------|------|------|--------|
| GET | `/api/cycles` | Auth | List cycles |
| POST | `/api/cycles` | Admin | Create cycle |
| PUT | `/api/cycles/[id]` | Admin | Update cycle (open/close) |

### Invites

| Method | Path | Auth | Action |
|--------|------|------|--------|
| POST | `/api/invites/generate` | Admin/Manager | Generate invite token + send email |
| POST | `/api/invites/bulk` | Admin | Bulk invite via CSV |
| POST | `/api/invites/validate` | Public | Validate token on signup |

### Analytics

| Method | Path | Auth | Action |
|--------|------|------|--------|
| GET | `/api/analytics` | Admin | Aggregated stats for dashboard |

### Reports

| Method | Path | Auth | Action |
|--------|------|------|--------|
| GET | `/api/reports/export` | Admin | Stream Excel file (xlsx) |

### Cron

| Method | Path | Auth | Action |
|--------|------|------|--------|
| POST | `/api/cron/escalation` | Bearer CRON_SECRET | Run escalation check |
| POST | `/api/cron/checkin-reminder` | Bearer CRON_SECRET | Send check-in reminder emails |

---

## 3. Page Components

### Employee pages (`app/(app)/employee/`)

**`/goals`** — Server Component. Fetches own GoalSheet for active cycle. Shows status badge, goal count, total weightage.

**`/goals/new`** — Client page. GoalSheetForm component. Zod-validated. Enforces max 8 goals + weightage = 100%.

**`/goals/[id]`** — Server Component + Client submit button. Shows all goals with per-goal achievement grid (Q1–Q4). `GoalSheetSubmitButton` calls `/api/goals/[id]/submit`.

**`/check-ins`** — Server Component. Shows check-in comments from manager per quarter.

**`/check-ins/[quarter]`** — `CheckInClient`. Employee views manager's quarterly comment for that quarter.

### Manager pages (`app/(app)/manager/`)

**`/approvals`** — Server Component. Lists SUBMITTED sheets for this manager's reports. Badge counts.

**`/approvals/[sheetId]`** — Server Component. Full sheet detail with inline-edit for goals, approve/return buttons.

**`/team`** — `TeamTableClient`. Lists reports. `TeamInviteTools` for generating + sending invites.

**`/check-ins/[quarter]`** — Server Component. Per-employee sheet with comment form.

**`/shared-goals`** — `SharedGoalClient`. Manager picks a goal + employees to share it with.

### Admin pages (`app/(app)/admin/`)

**`/users`** — Paginated table. Create/edit modal. Role/dept/manager assignment.

**`/cycles`** — Create and activate goal cycles. Phase selection (GOAL_SETTING, Q1–Q4).

**`/analytics`** — Charts: QoQ score trend (line), dept completion heatmap (grid), manager effectiveness (bar), top 10 goals.

**`/escalations`** — CRUD for EscalationRule. View open/resolved EscalationEvents.

**`/audit`** — Paginated AuditLog table. Filter by entityType, action, user.

**`/reports`** — Trigger Excel export. All goal sheets with actuals + scores.

---

## 4. GoalSheetForm (components/goals/GoalSheetForm.tsx)

Key logic:
- Maintains `goals[]` array in RHF `useFieldArray`
- WeightageBar shows live sum; turns red if ≠ 100
- Each goal has its own UOM type selector — conditionally shows `targetValue` or `targetDate`
- On submit: POST `/api/goals` for each new goal, then optionally calls submit endpoint
- Shared goals: `isShared = true` disables title/description/uom fields; only weightage editable

---

## 5. Scoring Logic Detail

```
PUT /api/achievements/[goalId]
  body: { quarter, actualValue?, actualDate?, status, notes? }

  1. Load Goal.uomType, Goal.targetValue, Goal.targetDate
  2. computedScore = score.computeScore(...)
  3. db.goalAchievement.upsert({ goalId, quarter }, { actualValue, actualDate, status, computedScore, notes })
  4. logAudit(...)
  5. Return { computedScore }
```

Score capping: both NUMERIC formulas cap at 1.5 (150%) — over-achievement is acknowledged but bounded.

---

## 6. Invite Flow

```
Manager/Admin → POST /api/invites/generate
  → creates User with role=EMPLOYEE, inviteToken=uuid, no passwordHash
  → sendInviteEmail(email, token)

Invitee opens link /auth/signup?token=<token>
  → POST /api/invites/validate { token }
  → returns { valid: true, email }

User completes signup form
  → POST /api/auth/signup { token, name, password }
  → bcrypt.hash(password)
  → db.user.update({ inviteToken: null, passwordHash })
```

---

## 7. Password Reset Flow

```
POST /api/auth/forgot-password { email }
  → generate resetToken (uuid), resetTokenExpiry (now + 1h)
  → db.user.update({ resetToken, resetTokenExpiry })
  → sendPasswordResetEmail(email, token)

GET /reset-password?token=<token> (client validates token expiry)

POST /api/auth/reset-password { token, newPassword }
  → verify token + expiry
  → bcrypt.hash(newPassword)
  → db.user.update({ passwordHash, resetToken: null, resetTokenExpiry: null })
```

---

## 8. Excel Export

```
GET /api/reports/export
  → Prisma: all GoalSheets with goals, achievements, employee, cycle
  → Build XLSX workbook via xlsx library:
      Sheet 1: summary (employee, dept, cycle, sheet status)
      Sheet 2: goals (goal title, thrust area, weightage, uom, target)
      Sheet 3: actuals (per goal per quarter: actual, score, status)
  → Stream as application/octet-stream
```

---

## 9. Shared Goals Sync

`isShared` goals pull their title, description, uomType, targetValue, targetDate from the `primaryGoal`. Recipients cannot edit these fields. `GoalAchievement` records are per-recipient — each employee's actual is independent. Manager reviews each recipient separately on the approvals page.

---

## 10. Error Handling Pattern

All API routes follow this pattern:
```ts
try {
  const body = schema.parse(await req.json())    // 400 on Zod failure
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(session.user.role, requiredRole)) return 403
  // ... db operation
  logAudit(...)
  return NextResponse.json(result)
} catch (e) {
  if (e instanceof ZodError) return NextResponse.json({ error: e.flatten() }, { status: 400 })
  console.error(e)
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
```
