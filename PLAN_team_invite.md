# AtomQuest — Team Building & Goal Sheet UI Plan

## Scope (5 features)

### 1. Goal Sheet Detail Page Redesign
**File**: `app/(app)/employee/goals/[id]/page.tsx`

Replace shadcn Card/Badge with design system. Current: bare skeleton.
Target: rich panel layout matching the rest of the app.

Layout:
- PageHeader with eyebrow `employee · goals`, title = cycle label, status pill + actions (Edit / Submit buttons)
- ReturnNote panel (if returned) — gold left-border callout
- Goal cards: `.panel` with padding, icon, thrust area pill, UoM badge, target/date row, achievement grid for approved sheets
- WeightBar at bottom of each card (full-width, `panel-hover` style)
- Bottom action bar: "Submit for approval" button (POST `/api/goals/[sheetId]/submit`) with weightage validation

No new API needed — submit route already exists at `app/api/goals/[id]/submit/route.ts`.

---

### 2. Manager Invite Deep-Link
**Schema change** (no migration needed — `db:push`):
Add to `User` model:
```
inviteToken  String?  @unique
```

**New API**: `POST /api/invites/generate` (MANAGER/ADMIN only)
- Creates random token (crypto.randomUUID()), stores on session.user row
- Returns `{ url: "https://app.../signup?invite=TOKEN" }`

**New email** in `lib/email.ts`:
```ts
export function managerInviteEmail(toEmail: string, managerName: string, inviteUrl: string)
```

**Modified signup** `app/api/auth/signup/route.ts`:
- Accept optional `inviteToken` in body
- If provided: look up manager by `inviteToken`, set `managerId` on new user
- Force `role: "EMPLOYEE"` when using invite token

**Login page** `app/(auth)/login/page.tsx`:
- Read `?invite=TOKEN` from URL, pass through to signup form
- Show "You've been invited by [manager]" banner if token is present (pre-flight GET `/api/invites/validate?token=TOKEN`)

**New API**: `GET /api/invites/validate?token=TOKEN` — returns `{ managerName: string }` or 404

---

### 3. Team Building (Admin + Manager)
**Modified**: `app/(app)/admin/users/page.tsx`

Add two new panels below the existing user table:

**Panel A — Bulk Email Invite**
- Textarea for comma/newline-separated emails
- Select manager to assign
- "Send invites" → `POST /api/invites/bulk`
- Creates accounts with temp password, sends `welcomeEmail` via Resend

**New API**: `POST /api/invites/bulk` (ADMIN only)
```ts
body: { emails: string[], managerId?: string, role: "EMPLOYEE" }
```
- For each email: create user (random 12-char password), set managerId, send welcomeEmail with one-time password reset link
- Returns `{ created: n, failed: string[] }`

**Panel B — Mock Import from Teams**
- Button "Import from Microsoft Teams"
- Opens modal with a fake Teams user list (static demo data)
- Checkbox-select + "Import selected" button → same bulk create flow
- No real Teams API — clearly labelled "Demo: uses sample data"

---

### 4. Manager Reassignment
**New API**: `PATCH /api/users/[id]` (ADMIN only for managerId change)
```ts
body: { managerId?: string | null }
// For manager transfer: also accept { transferReportsTo: string }
```

**Modified**: `app/(app)/admin/users/page.tsx`
- Add action column to users table with "···" menu per row
- Menu options: "Change manager" (opens manager picker dialog)
- On confirm: PATCH `/api/users/[id]` with new managerId

**Modified**: `app/(app)/manager/team/page.tsx`
- Add "Transfer to another manager" button per report row
- Opens manager picker dialog
- PATCH `/api/users/[employeeId]` with new managerId
- Requires MANAGER role but only for own reports

---

### 5. New Email Template
`lib/email.ts` — add:
```ts
export function managerInviteEmail(toEmail, managerName, inviteUrl)
// Subject: "You've been invited to AtomQuest by [managerName]"
// CTA button: Join AtomQuest
```

---

## Files to Create
- `app/api/invites/generate/route.ts`
- `app/api/invites/validate/route.ts`
- `app/api/invites/bulk/route.ts`
- `app/api/users/[id]/route.ts` (PATCH handler)

## Files to Modify
- `prisma/schema.prisma` → add `inviteToken String? @unique` to User
- `app/(app)/employee/goals/[id]/page.tsx` → full redesign
- `app/api/auth/signup/route.ts` → accept inviteToken
- `app/(app)/admin/users/page.tsx` → bulk invite panels + row actions
- `app/(app)/manager/team/page.tsx` → transfer button
- `lib/email.ts` → add managerInviteEmail
- `app/(auth)/login/page.tsx` → read invite param, show banner

## Execution Order
1. Schema change + `db:push`
2. Goal sheet page redesign (independent)
3. Invite APIs (generate, validate, bulk)
4. Signup route update + login page invite banner
5. Admin users page additions (bulk invite, row actions)
6. Manager team page transfer button
7. Email template

## Verification
- Employee signs up via `/signup?invite=TOKEN` → lands with manager pre-assigned
- Admin bulk invite: paste 3 emails → 3 users created, 3 welcome emails sent
- Goal sheet detail: DRAFT shows Edit + Submit, APPROVED shows achievement grid
- Admin changes manager from user row → PATCH succeeds, user list refreshes
