import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

const hash = (pw: string) => bcrypt.hash(pw, 10);

// Score helpers
function numericMinScore(actual: number, target: number) {
  return Math.min(actual / target, 1.5);
}
function numericMaxScore(actual: number, target: number) {
  return Math.min(target / actual, 1.5);
}

async function main() {
  // ─── Departments ───────────────────────────────────────────────
  const depts = await Promise.all([
    db.department.upsert({ where: { id: "dept-eng" },   update: {}, create: { id: "dept-eng",   name: "Engineering" } }),
    db.department.upsert({ where: { id: "dept-rd" },    update: {}, create: { id: "dept-rd",    name: "R&D" } }),
    db.department.upsert({ where: { id: "dept-prod" },  update: {}, create: { id: "dept-prod",  name: "Product" } }),
    db.department.upsert({ where: { id: "dept-qual" },  update: {}, create: { id: "dept-qual",  name: "Quality" } }),
    db.department.upsert({ where: { id: "dept-ops" },   update: {}, create: { id: "dept-ops",   name: "Operations" } }),
    db.department.upsert({ where: { id: "dept-fin" },   update: {}, create: { id: "dept-fin",   name: "Finance" } }),
    db.department.upsert({ where: { id: "dept-people"}, update: {}, create: { id: "dept-people",name: "People" } }),
  ]);
  const [dEng, dRd, dProd, dQual, dOps, dFin, dPeople] = depts;

  // ─── Admin ─────────────────────────────────────────────────────
  const admin = await db.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: { email: "admin@demo.com", name: "Admin User", passwordHash: await hash("Admin@123"), role: "ADMIN", departmentId: dEng.id },
  });

  // ─── Managers ──────────────────────────────────────────────────
  const mgrs = await Promise.all([
    db.user.upsert({ where: { email: "manager@demo.com" },         update: {}, create: { email: "manager@demo.com",         name: "Sarah Manager",  passwordHash: await hash("Manager@123"), role: "MANAGER", departmentId: dEng.id } }),
    db.user.upsert({ where: { email: "riya.menon@atomberg.com" },  update: {}, create: { email: "riya.menon@atomberg.com",  name: "Riya Menon",     passwordHash: await hash("Manager@123"), role: "MANAGER", departmentId: dRd.id } }),
    db.user.upsert({ where: { email: "vikas.talwar@atomberg.com"},  update: {}, create: { email: "vikas.talwar@atomberg.com", name: "Vikas Talwar",   passwordHash: await hash("Manager@123"), role: "MANAGER", departmentId: dProd.id } }),
    db.user.upsert({ where: { email: "sneha.iyer@atomberg.com" },  update: {}, create: { email: "sneha.iyer@atomberg.com",  name: "Sneha Iyer",     passwordHash: await hash("Manager@123"), role: "MANAGER", departmentId: dQual.id } }),
    db.user.upsert({ where: { email: "rohan.kapoor@atomberg.com"}, update: {}, create: { email: "rohan.kapoor@atomberg.com", name: "Rohan Kapoor",   passwordHash: await hash("Manager@123"), role: "MANAGER", departmentId: dOps.id } }),
  ]);
  const [mgrSarah, mgrRiya, mgrVikas, mgrSneha, mgrRohan] = mgrs;

  // ─── Employees ─────────────────────────────────────────────────
  const empData = [
    // Engineering (Sarah)
    { id: "emp-1",  email: "emp@demo.com",              name: "John Employee",   dept: dEng.id,    mgr: mgrSarah.id, pw: "Emp@123" },
    { id: "emp-2",  email: "aryan.shah@atomberg.com",   name: "Aryan Shah",      dept: dEng.id,    mgr: mgrSarah.id, pw: "Emp@123" },
    { id: "emp-3",  email: "priya.nair@atomberg.com",   name: "Priya Nair",      dept: dEng.id,    mgr: mgrSarah.id, pw: "Emp@123" },
    // R&D (Riya)
    { id: "emp-4",  email: "anika.sharma@atomberg.com", name: "Anika Sharma",    dept: dRd.id,     mgr: mgrRiya.id,  pw: "Emp@123" },
    { id: "emp-5",  email: "karan.verma@atomberg.com",  name: "Karan Verma",     dept: dRd.id,     mgr: mgrRiya.id,  pw: "Emp@123" },
    { id: "emp-6",  email: "devika.pillai@atomberg.com",name: "Devika Pillai",   dept: dRd.id,     mgr: mgrRiya.id,  pw: "Emp@123" },
    { id: "emp-7",  email: "hiren.thakur@atomberg.com", name: "Hiren Thakur",    dept: dRd.id,     mgr: mgrRiya.id,  pw: "Emp@123" },
    // Product (Vikas)
    { id: "emp-8",  email: "mira.kapoor@atomberg.com",  name: "Mira Kapoor",     dept: dProd.id,   mgr: mgrVikas.id, pw: "Emp@123" },
    { id: "emp-9",  email: "sahil.bose@atomberg.com",   name: "Sahil Bose",      dept: dProd.id,   mgr: mgrVikas.id, pw: "Emp@123" },
    { id: "emp-10", email: "tanvi.rao@atomberg.com",    name: "Tanvi Rao",       dept: dProd.id,   mgr: mgrVikas.id, pw: "Emp@123" },
    // Quality (Sneha)
    { id: "emp-11", email: "rhea.nair@atomberg.com",    name: "Rhea Nair",       dept: dQual.id,   mgr: mgrSneha.id, pw: "Emp@123" },
    { id: "emp-12", email: "amit.joshi@atomberg.com",   name: "Amit Joshi",      dept: dQual.id,   mgr: mgrSneha.id, pw: "Emp@123" },
    { id: "emp-13", email: "neha.gupta@atomberg.com",   name: "Neha Gupta",      dept: dQual.id,   mgr: mgrSneha.id, pw: "Emp@123" },
    // Operations (Rohan)
    { id: "emp-14", email: "siddharth.m@atomberg.com",  name: "Siddharth Mehta", dept: dOps.id,    mgr: mgrRohan.id, pw: "Emp@123" },
    { id: "emp-15", email: "lakshmi.v@atomberg.com",    name: "Lakshmi Venkat",  dept: dOps.id,    mgr: mgrRohan.id, pw: "Emp@123" },
    { id: "emp-16", email: "farhan.sheikh@atomberg.com",name: "Farhan Sheikh",   dept: dOps.id,    mgr: mgrRohan.id, pw: "Emp@123" },
    // Finance
    { id: "emp-17", email: "pooja.mehta@atomberg.com",  name: "Pooja Mehta",     dept: dFin.id,    mgr: mgrSarah.id, pw: "Emp@123" },
    { id: "emp-18", email: "ravi.kumar@atomberg.com",   name: "Ravi Kumar",      dept: dFin.id,    mgr: mgrSarah.id, pw: "Emp@123" },
    // People
    { id: "emp-19", email: "ananya.singh@atomberg.com", name: "Ananya Singh",    dept: dPeople.id, mgr: mgrRiya.id,  pw: "Emp@123" },
    { id: "emp-20", email: "kabir.das@atomberg.com",    name: "Kabir Das",       dept: dPeople.id, mgr: mgrRiya.id,  pw: "Emp@123" },
  ];

  const employees: Record<string, { id: string }> = {};
  for (const e of empData) {
    const u = await db.user.upsert({
      where: { email: e.email },
      update: {},
      create: { email: e.email, name: e.name, passwordHash: await hash(e.pw), role: "EMPLOYEE", managerId: e.mgr, departmentId: e.dept },
    });
    employees[e.id] = u;
  }

  // ─── Escalation rules ──────────────────────────────────────────
  await db.escalationRule.upsert({ where: { id: "esc-submission" }, update: {}, create: { id: "esc-submission", trigger: "SUBMISSION", daysThreshold: 7,  isActive: true, description: "Employee hasn't submitted goals within 7 days of cycle open" } });
  await db.escalationRule.upsert({ where: { id: "esc-approval" },   update: {}, create: { id: "esc-approval",   trigger: "APPROVAL",   daysThreshold: 5,  isActive: true, description: "Manager hasn't approved goals within 5 days of submission" } });
  await db.escalationRule.upsert({ where: { id: "esc-checkin" },    update: {}, create: { id: "esc-checkin",    trigger: "CHECKIN",    daysThreshold: 10, isActive: true, description: "Manager hasn't completed check-in within 10 days of quarter end" } });

  // ─── Past cycles + active ─────────────────────────────────────
  const cycles = await Promise.all([
    db.goalCycle.upsert({ where: { id: "cycle-2025-gs" }, update: {}, create: { id: "cycle-2025-gs", year: 2025, phase: "GOAL_SETTING", openDate: new Date("2024-12-01"), closeDate: new Date("2024-12-31"), isActive: false } }),
    db.goalCycle.upsert({ where: { id: "cycle-2025-q1" }, update: {}, create: { id: "cycle-2025-q1", year: 2025, phase: "Q1",           openDate: new Date("2025-01-01"), closeDate: new Date("2025-03-31"), isActive: false } }),
    db.goalCycle.upsert({ where: { id: "cycle-2025-q2" }, update: {}, create: { id: "cycle-2025-q2", year: 2025, phase: "Q2",           openDate: new Date("2025-04-01"), closeDate: new Date("2025-06-30"), isActive: false } }),
    db.goalCycle.upsert({ where: { id: "cycle-2025-q3" }, update: {}, create: { id: "cycle-2025-q3", year: 2025, phase: "Q3",           openDate: new Date("2025-07-01"), closeDate: new Date("2025-09-30"), isActive: false } }),
    db.goalCycle.upsert({ where: { id: "cycle-2025-q4" }, update: {}, create: { id: "cycle-2025-q4", year: 2025, phase: "Q4",           openDate: new Date("2025-10-01"), closeDate: new Date("2025-12-31"), isActive: false } }),
    db.goalCycle.upsert({ where: { id: "cycle-2026-goal-setting" }, update: {}, create: { id: "cycle-2026-goal-setting", year: 2026, phase: "GOAL_SETTING", openDate: new Date("2026-05-01"), closeDate: new Date("2026-06-30"), isActive: true } }),
  ]);
  const [cy25gs, cy25q1, cy25q2, cy25q3, cy25q4, cy26gs] = cycles;

  // ─── Goal templates per thrust area ───────────────────────────
  const goalTemplates = [
    { thrustArea: "Engineering", title: "Reduce build pipeline time",     description: "Cut p95 CI run time from the current 12 min to under 8 min via parallel jobs and remote caching on the Renesa-7 firmware build.",        uomType: "NUMERIC_MAX" as const, targetValue: 8,  weightage: 25 },
    { thrustArea: "Engineering", title: "Achieve 90% unit test coverage", description: "Raise unit-test coverage org-wide. Focus on BLE stack, OTA manager, and motor-control modules currently sitting at ~64%.",               uomType: "NUMERIC_MIN" as const, targetValue: 90, weightage: 25 },
    { thrustArea: "Quality",     title: "Reduce defect escape rate",      description: "Reduce defects escaping to production lines, targeting < 2 DPPM using SPC controls and improved end-of-line test scripts.",               uomType: "NUMERIC_MAX" as const, targetValue: 2,  weightage: 20 },
    { thrustArea: "Quality",     title: "Complete ISO 9001 audit",        description: "Close all major non-conformances from FY25 recertification audit and pass with zero critical findings before the September deadline.",      uomType: "TIMELINE" as const,    targetDate: new Date("2025-09-30"), weightage: 15 },
    { thrustArea: "Operations",  title: "On-time delivery rate",          description: "Sustain on-time dispatch rate ≥ 95% across IntelliSense and Renesa-7 product lines. Track weekly via logistics dashboard.",               uomType: "NUMERIC_MIN" as const, targetValue: 95, weightage: 30 },
    { thrustArea: "People",      title: "Employee NPS score",             description: "Improve team NPS through structured 1:1s, bi-weekly recognition shout-outs, and one career conversation per person per quarter.",         uomType: "NUMERIC_MIN" as const, targetValue: 70, weightage: 20 },
    { thrustArea: "Finance",     title: "Cost variance within budget",    description: "Ensure department spend does not exceed the approved FY26 opex budget. Zero cost overruns — any exception requires VP sign-off in advance.", uomType: "ZERO" as const,        weightage: 20 },
  ];

  // Employee subsets assigned to each past cycle
  const allEmpIds = Object.values(employees).map((e) => e.id);

  // Helper: create a goal sheet with goals and achievements for a past cycle
  async function seedPastSheet(
    cycleId: string,
    employeeId: string,
    managerId: string,
    quarterPhase: "Q1" | "Q2" | "Q3" | "Q4",
    avgScoreTarget: number // 0.7–1.3
  ) {
    const existingSheet = await db.goalSheet.findFirst({ where: { employeeId, cycleId } });
    if (existingSheet) return;

    const sheet = await db.goalSheet.create({
      data: {
        employeeId,
        cycleId,
        status: "APPROVED",
        submittedAt: new Date(Date.now() - 30 * 86400000),
        approvedAt:  new Date(Date.now() - 25 * 86400000),
        approvedById: managerId,
      },
    });

    // Pick 3 goals
    const picked = goalTemplates.slice(0, 3);
    const totalW = picked.reduce((s, g) => s + g.weightage, 0);
    for (const tpl of picked) {
      const w = parseFloat(((tpl.weightage / totalW) * 100).toFixed(1));
      const goal = await db.goal.create({
        data: {
          sheetId: sheet.id,
          thrustArea: tpl.thrustArea,
          title: tpl.title,
          description: tpl.description ?? null,
          uomType: tpl.uomType,
          targetValue: tpl.targetValue ?? null,
          targetDate: tpl.targetDate ?? null,
          weightage: w,
          isLocked: true,
        },
      });

      // Achievement with realistic score
      const jitter = (Math.random() - 0.5) * 0.2;
      const scoreRaw = Math.max(0, Math.min(1.5, avgScoreTarget + jitter));

      let actualValue: number | null = null;
      let actualDate: Date | null = null;
      let computedScore = scoreRaw;

      if (tpl.uomType === "NUMERIC_MIN" && tpl.targetValue) {
        actualValue = tpl.targetValue * scoreRaw;
        computedScore = numericMinScore(actualValue, tpl.targetValue);
      } else if (tpl.uomType === "NUMERIC_MAX" && tpl.targetValue) {
        actualValue = tpl.targetValue / scoreRaw;
        computedScore = numericMaxScore(tpl.targetValue, actualValue);
      } else if (tpl.uomType === "TIMELINE") {
        actualDate = scoreRaw >= 1.0 ? new Date("2025-09-28") : new Date("2025-10-10");
        computedScore = scoreRaw >= 1.0 ? 1.0 : 0.0;
      } else if (tpl.uomType === "ZERO") {
        actualValue = scoreRaw >= 1.0 ? 0 : 1;
        computedScore = scoreRaw >= 1.0 ? 1.0 : 0.0;
      }

      await db.goalAchievement.create({
        data: {
          goalId: goal.id,
          quarter: quarterPhase,
          actualValue,
          actualDate,
          status: "COMPLETED",
          computedScore: parseFloat(computedScore.toFixed(3)),
          notes: "Completed as per plan",
        },
      });
    }

    // Check-in comment
    await db.checkinComment.create({
      data: {
        goalSheetId: sheet.id,
        quarter: quarterPhase,
        managerId,
        comment: "Good progress this quarter. Keep it up!",
      },
    });
  }

  // ─── Seed past cycle sheets ────────────────────────────────────
  // Q1 2025 — 15 employees, avg score rising from ~0.85
  const q1Emps = allEmpIds.slice(0, 15);
  for (let i = 0; i < q1Emps.length; i++) {
    const mgr = i < 3 ? mgrSarah.id : i < 7 ? mgrRiya.id : i < 10 ? mgrVikas.id : i < 13 ? mgrSneha.id : mgrRohan.id;
    await seedPastSheet(cy25q1.id, q1Emps[i], mgr, "Q1", 0.84 + i * 0.006);
  }

  // Q2 2025 — 16 employees, avg ~0.90
  const q2Emps = allEmpIds.slice(0, 16);
  for (let i = 0; i < q2Emps.length; i++) {
    const mgr = i < 3 ? mgrSarah.id : i < 7 ? mgrRiya.id : i < 10 ? mgrVikas.id : i < 13 ? mgrSneha.id : mgrRohan.id;
    await seedPastSheet(cy25q2.id, q2Emps[i], mgr, "Q2", 0.89 + i * 0.005);
  }

  // Q3 2025 — 17 employees, avg ~0.95
  const q3Emps = allEmpIds.slice(0, 17);
  for (let i = 0; i < q3Emps.length; i++) {
    const mgr = i < 3 ? mgrSarah.id : i < 7 ? mgrRiya.id : i < 10 ? mgrVikas.id : i < 13 ? mgrSneha.id : mgrRohan.id;
    await seedPastSheet(cy25q3.id, q3Emps[i], mgr, "Q3", 0.94 + i * 0.005);
  }

  // Q4 2025 — 18 employees, avg ~1.01
  const q4Emps = allEmpIds.slice(0, 18);
  for (let i = 0; i < q4Emps.length; i++) {
    const mgr = i < 3 ? mgrSarah.id : i < 7 ? mgrRiya.id : i < 10 ? mgrVikas.id : i < 13 ? mgrSneha.id : mgrRohan.id;
    await seedPastSheet(cy25q4.id, q4Emps[i], mgr, "Q4", 1.00 + i * 0.005);
  }

  // FY2026 Goal-Setting cycle — current, mix of DRAFT/SUBMITTED/APPROVED
  const gs26Statuses = ["APPROVED", "APPROVED", "APPROVED", "SUBMITTED", "SUBMITTED", "DRAFT", "DRAFT", "APPROVED", "APPROVED", "SUBMITTED"] as const;
  for (let i = 0; i < 10; i++) {
    const empId = allEmpIds[i];
    const mgr = i < 3 ? mgrSarah.id : i < 7 ? mgrRiya.id : mgrVikas.id;
    const status = gs26Statuses[i];
    const existing = await db.goalSheet.findFirst({ where: { employeeId: empId, cycleId: cy26gs.id } });
    if (existing) continue;
    await db.goalSheet.create({
      data: {
        employeeId: empId,
        cycleId: cy26gs.id,
        status,
        submittedAt: status !== "DRAFT" ? new Date("2026-05-10") : null,
        approvedAt:  status === "APPROVED" ? new Date("2026-05-14") : null,
        approvedById: status === "APPROVED" ? mgr : null,
        goals: {
          create: goalTemplates.slice(0, 3).map((tpl, gi) => ({
            thrustArea: tpl.thrustArea,
            title: tpl.title,
            description: tpl.description ?? null,
            uomType: tpl.uomType,
            targetValue: tpl.targetValue ?? null,
            targetDate: tpl.targetDate ?? null,
            weightage: gi === 0 ? 40 : gi === 1 ? 35 : 25,
            isLocked: status === "APPROVED",
          })),
        },
      },
    });
  }

  // FY2025 GS cycle — 18 approved sheets
  for (let i = 0; i < 18; i++) {
    const empId = allEmpIds[i];
    const mgr = i < 3 ? mgrSarah.id : i < 7 ? mgrRiya.id : i < 10 ? mgrVikas.id : i < 13 ? mgrSneha.id : mgrRohan.id;
    const existing = await db.goalSheet.findFirst({ where: { employeeId: empId, cycleId: cy25gs.id } });
    if (existing) continue;
    await db.goalSheet.create({
      data: {
        employeeId: empId,
        cycleId: cy25gs.id,
        status: "APPROVED",
        submittedAt: new Date("2024-12-08"),
        approvedAt:  new Date("2024-12-12"),
        approvedById: mgr,
        goals: {
          create: goalTemplates.slice(0, 3).map((tpl, gi) => ({
            thrustArea: tpl.thrustArea,
            title: tpl.title,
            description: tpl.description ?? null,
            uomType: tpl.uomType,
            targetValue: tpl.targetValue ?? null,
            targetDate: tpl.targetDate ?? null,
            weightage: gi === 0 ? 40 : gi === 1 ? 35 : 25,
            isLocked: true,
          })),
        },
      },
    });
  }

  console.log("✅ Seeded:");
  console.log("   Users:", 1 + mgrs.length + empData.length);
  console.log("   Cycles:", cycles.length);
  console.log("   Departments:", depts.length);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
