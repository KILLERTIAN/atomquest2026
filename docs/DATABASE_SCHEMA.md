# Database Schema

PostgreSQL 15 via Supabase. ORM: Prisma 7.

---

## Entity Relationship Diagram

```
┌────────────┐       ┌──────────────────────────────────────────────┐
│ Department │       │                    User                       │
│────────────│       │──────────────────────────────────────────────│
│ id (PK)    │──────<│ id (PK)                                       │
│ name       │       │ email (UNIQUE)                                │
│ createdAt  │       │ name                                          │
│ updatedAt  │       │ passwordHash                                  │
└────────────┘       │ role: EMPLOYEE | MANAGER | ADMIN              │
                     │ avatarUrl                                     │
                     │ azureId (UNIQUE)                              │
                     │ resetToken (UNIQUE)                           │
                     │ resetTokenExpiry                              │
                     │ inviteToken (UNIQUE)                          │
                     │ managerId (FK → User.id) self-ref             │
                     │ departmentId (FK → Department.id)             │
                     │ createdAt / updatedAt                         │
                     └──────────────────────────────────────────────┘
                           │           │           │          │
              ┌────────────┘           │           │          └────────────────┐
              ▼                        ▼           ▼                           ▼
     ┌─────────────────┐   ┌──────────────────┐  ┌──────────────┐  ┌─────────────────┐
     │   GoalSheet     │   │  CheckinComment  │  │  AuditLog    │  │  Notification   │
     │─────────────────│   │──────────────────│  │──────────────│  │─────────────────│
     │ id (PK)         │   │ id (PK)          │  │ id (PK)      │  │ id (PK)         │
     │ status          │   │ quarter          │  │ entityType   │  │ type            │
     │ submittedAt     │   │ comment          │  │ entityId     │  │ title           │
     │ approvedAt      │   │ goalSheetId (FK) │  │ action       │  │ message         │
     │ returnNote      │   │ managerId (FK)   │  │ oldValue     │  │ link            │
     │ employeeId (FK) │   │ createdAt        │  │ newValue     │  │ readAt          │
     │ cycleId (FK)    │   └──────────────────┘  │ changedById  │  │ userId (FK)     │
     │ approvedById FK │                         │  (FK→User)   │  │ createdAt       │
     │ createdAt       │                         │ createdAt    │  └─────────────────┘
     │ updatedAt       │                         └──────────────┘
     └────────┬────────┘
              │                   ┌─────────────────┐
              │                   │   GoalCycle      │
              │   ┌───────────────│─────────────────│
              │   │               │ id (PK)          │
              │   │               │ year             │
              │   │               │ phase            │
              │   │               │ openDate         │
              │   │               │ closeDate        │
              │   │               │ isActive         │
              │   │               │ createdAt        │
              └───┼───────────────│ updatedAt        │
          FK╗     │               └─────────────────┘
              ▼   │
          ┌───────────────────────────────────────┐
          │                 Goal                  │
          │───────────────────────────────────────│
          │ id (PK)                               │
          │ thrustArea                            │
          │ title                                 │
          │ description                           │
          │ uomType: NUMERIC_MIN|NUMERIC_MAX|      │
          │          TIMELINE|ZERO                │
          │ targetValue                           │
          │ targetDate                            │
          │ weightage                             │
          │ isShared                              │
          │ isLocked                              │
          │ sheetId (FK → GoalSheet)              │
          │ primaryGoalId (FK → Goal.id) self-ref │
          │ createdAt / updatedAt                 │
          └───────────────────┬───────────────────┘
                              │
                              ▼
                ┌─────────────────────────┐
                │    GoalAchievement       │
                │─────────────────────────│
                │ id (PK)                  │
                │ quarter: CyclePhase      │
                │ actualValue              │
                │ actualDate               │
                │ status: NOT_STARTED      │
                │         ON_TRACK         │
                │         COMPLETED        │
                │ computedScore            │
                │ notes                    │
                │ goalId (FK → Goal)       │
                │ createdAt / updatedAt    │
                │ UNIQUE(goalId, quarter)  │
                └──────────────────────────┘

Escalation:
┌────────────────────┐        ┌─────────────────────────┐
│  EscalationRule    │───────<│   EscalationEvent        │
│────────────────────│        │─────────────────────────│
│ id (PK)            │        │ id (PK)                  │
│ trigger:           │        │ entityType               │
│  SUBMISSION        │        │ entityId                 │
│  APPROVAL          │        │ triggeredAt              │
│  CHECKIN           │        │ resolvedAt               │
│ daysThreshold      │        │ notifLog (JSON)          │
│ isActive           │        │ ruleId (FK)              │
│ description        │        │ resolvedById (FK → User) │
│ createdAt          │        └──────────────────────────┘
│ updatedAt          │
└────────────────────┘
```

---

## Enums

| Enum | Values |
|---|---|
| `Role` | `EMPLOYEE`, `MANAGER`, `ADMIN` |
| `CyclePhase` | `GOAL_SETTING`, `Q1`, `Q2`, `Q3`, `Q4` |
| `SheetStatus` | `DRAFT`, `SUBMITTED`, `APPROVED`, `RETURNED` |
| `UomType` | `NUMERIC_MIN`, `NUMERIC_MAX`, `TIMELINE`, `ZERO` |
| `AchievementStatus` | `NOT_STARTED`, `ON_TRACK`, `COMPLETED` |
| `EscalationTrigger` | `SUBMISSION`, `APPROVAL`, `CHECKIN` |

---

## Tables

### `Department`
| Column | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| name | String | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

---

### `User`
| Column | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| email | String | UNIQUE |
| name | String | |
| passwordHash | String? | null for Azure AD-only users |
| role | Role | default: EMPLOYEE |
| avatarUrl | String? | |
| azureId | String? | UNIQUE — set on Entra ID login |
| resetToken | String? | UNIQUE — 1h expiry |
| resetTokenExpiry | DateTime? | |
| inviteToken | String? | UNIQUE — cleared on signup completion |
| managerId | String? | FK → User.id (self-referential) |
| departmentId | String? | FK → Department.id |
| createdAt | DateTime | |
| updatedAt | DateTime | |

Indexes: `email`, `azureId`, `resetToken`, `inviteToken`, `managerId`

---

### `GoalCycle`
| Column | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| year | Int | e.g. 2026 |
| phase | CyclePhase | one cycle per phase per year |
| openDate | DateTime | |
| closeDate | DateTime | |
| isActive | Boolean | only one should be active at a time |
| createdAt | DateTime | |
| updatedAt | DateTime | |

---

### `GoalSheet`
| Column | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| status | SheetStatus | default: DRAFT |
| submittedAt | DateTime? | set on submit |
| approvedAt | DateTime? | set on approve |
| returnNote | String? | set when RETURNED |
| employeeId | String | FK → User |
| cycleId | String | FK → GoalCycle |
| approvedById | String? | FK → User (manager who approved) |
| createdAt | DateTime | |
| updatedAt | DateTime | |

One sheet per employee per cycle.

---

### `Goal`
| Column | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| thrustArea | String | category (e.g. "Revenue", "Ops") |
| title | String | |
| description | String? | |
| uomType | UomType | determines scoring formula |
| targetValue | Float? | for NUMERIC_MIN / NUMERIC_MAX |
| targetDate | DateTime? | for TIMELINE |
| weightage | Float | 10–100; all goals in sheet must sum to 100 |
| isShared | Boolean | default: false; shared goals from admin |
| isLocked | Boolean | default: false; true after manager approval |
| sheetId | String | FK → GoalSheet (cascade delete) |
| primaryGoalId | String? | FK → Goal.id (self-ref for shared goals) |
| createdAt | DateTime | |
| updatedAt | DateTime | |

Constraints enforced in application layer:
- Max 8 goals per sheet
- Weightage per goal ≥ 10
- Sum of weightage = 100

---

### `GoalAchievement`
| Column | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| quarter | CyclePhase | Q1–Q4 |
| actualValue | Float? | |
| actualDate | DateTime? | for TIMELINE goals |
| status | AchievementStatus | default: NOT_STARTED |
| computedScore | Float? | stored on save, never recomputed |
| notes | String? | |
| goalId | String | FK → Goal (cascade delete) |
| createdAt | DateTime | |
| updatedAt | DateTime | |

UNIQUE constraint: `(goalId, quarter)` — one record per goal per quarter.

---

### `CheckinComment`
| Column | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| quarter | CyclePhase | |
| comment | String | |
| goalSheetId | String | FK → GoalSheet |
| managerId | String | FK → User |
| createdAt | DateTime | |

---

### `AuditLog`
| Column | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| entityType | String | e.g. "GoalSheet", "Goal", "User" |
| entityId | String | |
| action | String | e.g. "APPROVE", "CREATE", "UPDATE" |
| oldValue | Json? | snapshot before change |
| newValue | Json? | snapshot after change |
| changedById | String | FK → User |
| createdAt | DateTime | |

Write-only. Never updated after insert.

---

### `EscalationRule`
| Column | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| trigger | EscalationTrigger | |
| daysThreshold | Int | number of days before escalating |
| isActive | Boolean | default: true |
| description | String? | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

---

### `EscalationEvent`
| Column | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| entityType | String | e.g. "GoalSheet" |
| entityId | String | |
| triggeredAt | DateTime | default: now() |
| resolvedAt | DateTime? | set when admin resolves |
| notifLog | Json? | log of notifications sent |
| ruleId | String | FK → EscalationRule |
| resolvedById | String? | FK → User (admin who resolved) |

---

### `Notification`
| Column | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| type | String | e.g. "APPROVAL", "RETURN", "ESCALATION" |
| title | String | |
| message | String | |
| link | String? | deep link to relevant page |
| readAt | DateTime? | null = unread |
| userId | String | FK → User (recipient) |
| createdAt | DateTime | |

---

## Key Relationships Summary

```
Department 1──* User
User       1──* User (manager → reports, self-ref)
User       1──* GoalSheet (as employee)
User       1──* GoalSheet (as approver)
User       1──* CheckinComment (as manager)
User       1──* AuditLog
User       1──* Notification
User       1──* EscalationEvent (as resolver)
GoalCycle  1──* GoalSheet
GoalSheet  1──* Goal (cascade delete)
GoalSheet  1──* CheckinComment
Goal       1──* GoalAchievement (cascade delete)
Goal       1──* Goal (primaryGoal → sharedCopies, self-ref)
EscalationRule 1──* EscalationEvent
```

---

## Prisma 7 Config Note

Connection URL lives in `prisma.config.ts`, not `schema.prisma`:

```ts
// prisma.config.ts
import { defineConfig } from 'prisma/config'
import { PrismaPg } from '@prisma/adapter-pg'

export default defineConfig({
  earlyAccess: true,
  schema: './prisma/schema.prisma',
  migrate: {
    adapter: async () => new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  },
})
```

`lib/db.ts` instantiates the client with the adapter for runtime queries.
