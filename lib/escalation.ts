import { db } from "./db";
import { escalationEmail } from "./email";
import { notify } from "./notify";

const LEVEL_ESCALATE_DAYS = 3;

function daysSince(date: Date): number {
  return (Date.now() - date.getTime()) / 86_400_000;
}

function levelFromLog(log: unknown): number {
  if (log && typeof log === "object" && "level" in (log as object)) {
    return (log as { level: number }).level;
  }
  return 1;
}

function levelTimestamp(log: unknown, level: number): Date | null {
  if (!log || typeof log !== "object") return null;
  const val = (log as Record<string, string>)[`l${level}At`];
  return val ? new Date(val) : null;
}

export async function runEscalationEngine() {
  const rules = await db.escalationRule.findMany({ where: { isActive: true } });
  const now = new Date();

  for (const rule of rules) {
    const cutoff = new Date(now.getTime() - rule.daysThreshold * 86_400_000);

    if (rule.trigger === "SUBMISSION") {
      const activeCycle = await db.goalCycle.findFirst({
        where: { isActive: true, phase: "GOAL_SETTING" },
      });
      if (!activeCycle || activeCycle.openDate > cutoff) continue;

      const employees = await db.user.findMany({
        where: {
          role: "EMPLOYEE",
          goalSheets: { none: { cycleId: activeCycle.id } },
        },
        include: { manager: { include: { manager: true } } },
      });

      for (const emp of employees) {
        const existing = await db.escalationEvent.findFirst({
          where: { ruleId: rule.id, entityId: emp.id, resolvedAt: null },
        });

        if (!existing) {
          await db.escalationEvent.create({
            data: {
              ruleId: rule.id,
              entityType: "USER",
              entityId: emp.id,
              notifLog: { level: 1, l1At: now.toISOString() },
            },
          });
          await escalationEmail(emp.email, `Your goal sheet for ${activeCycle.year} is overdue. Please submit immediately.`);
          await notify(emp.id, "escalation", "Goal sheet submission overdue", "Please submit your goal sheet.", "/employee/goals");
          continue;
        }

        const level = levelFromLog(existing.notifLog);

        if (level === 1) {
          const l1At = levelTimestamp(existing.notifLog, 1);
          if (!l1At || daysSince(l1At) < LEVEL_ESCALATE_DAYS) continue;
          await db.escalationEvent.update({
            where: { id: existing.id },
            data: { notifLog: { ...(existing.notifLog as object), level: 2, l2At: now.toISOString() } },
          });
          if (emp.manager) {
            await escalationEmail(emp.manager.email, `${emp.name} has still not submitted their goal sheet for ${activeCycle.year}. Please follow up.`);
            await notify(emp.manager.id, "escalation", "Direct report goal sheet overdue", `${emp.name} has not submitted their goal sheet.`, "/manager/team");
          }
          continue;
        }

        if (level === 2) {
          const l2At = levelTimestamp(existing.notifLog, 2);
          if (!l2At || daysSince(l2At) < LEVEL_ESCALATE_DAYS) continue;
          await db.escalationEvent.update({
            where: { id: existing.id },
            data: { notifLog: { ...(existing.notifLog as object), level: 3, l3At: now.toISOString() } },
          });
          const skipLevel = emp.manager?.manager;
          if (skipLevel) {
            await escalationEmail(skipLevel.email, `[Escalation L3] ${emp.name} has not submitted their goal sheet for ${activeCycle.year}.`);
            await notify(skipLevel.id, "escalation", "Escalation: goal sheet not submitted", `${emp.name} has not submitted for ${activeCycle.year}.`, "/admin/users");
          } else {
            const admins = await db.user.findMany({ where: { role: "ADMIN" }, select: { id: true, email: true } });
            for (const admin of admins) {
              await escalationEmail(admin.email, `[Escalation L3] ${emp.name} has not submitted their goal sheet for ${activeCycle.year}.`);
              await notify(admin.id, "escalation", "Escalation: goal sheet not submitted", `${emp.name} has not submitted for ${activeCycle.year}.`, "/admin/users");
            }
          }
        }
      }
    }

    if (rule.trigger === "APPROVAL") {
      const pendingSheets = await db.goalSheet.findMany({
        where: { status: "SUBMITTED", submittedAt: { lte: cutoff } },
        include: {
          employee: { include: { manager: { include: { manager: true } } } },
        },
      });

      for (const sheet of pendingSheets) {
        const existing = await db.escalationEvent.findFirst({
          where: { ruleId: rule.id, entityId: sheet.id, resolvedAt: null },
        });

        if (!existing) {
          await db.escalationEvent.create({
            data: {
              ruleId: rule.id,
              entityType: "GOAL_SHEET",
              entityId: sheet.id,
              notifLog: { level: 1, l1At: now.toISOString() },
            },
          });
          if (sheet.employee.manager) {
            await escalationEmail(sheet.employee.manager.email, `${sheet.employee.name}'s goal sheet has been pending approval for ${rule.daysThreshold}+ days.`);
            await notify(sheet.employee.manager.id, "escalation", "Approval overdue", `${sheet.employee.name}'s sheet awaits your approval.`, `/manager/approvals/${sheet.id}`);
          }
          continue;
        }

        const level = levelFromLog(existing.notifLog);

        if (level === 1) {
          const l1At = levelTimestamp(existing.notifLog, 1);
          if (!l1At || daysSince(l1At) < LEVEL_ESCALATE_DAYS) continue;
          await db.escalationEvent.update({
            where: { id: existing.id },
            data: { notifLog: { ...(existing.notifLog as object), level: 2, l2At: now.toISOString() } },
          });
          const skipLevel = sheet.employee.manager?.manager;
          if (skipLevel) {
            await escalationEmail(skipLevel.email, `[Escalation L2] ${sheet.employee.name}'s goal sheet is still pending approval.`);
            await notify(skipLevel.id, "escalation", "Escalation: approval pending", `${sheet.employee.name}'s goal sheet still not approved.`, "/admin/audit");
          } else {
            const admins = await db.user.findMany({ where: { role: "ADMIN" }, select: { id: true, email: true } });
            for (const admin of admins) {
              await escalationEmail(admin.email, `[Escalation L2] ${sheet.employee.name}'s goal sheet is still pending approval.`);
              await notify(admin.id, "escalation", "Escalation: approval pending", `${sheet.employee.name}'s goal sheet still not approved.`, "/admin/audit");
            }
          }
        }
      }
    }

    if (rule.trigger === "CHECKIN") {
      const activeCycle = await db.goalCycle.findFirst({
        where: { isActive: true, phase: { in: ["Q1", "Q2", "Q3", "Q4"] } },
      });
      if (!activeCycle || activeCycle.openDate > cutoff) continue;

      const quarter = activeCycle.phase as "Q1" | "Q2" | "Q3" | "Q4";

      const employees = await db.user.findMany({
        where: {
          role: "EMPLOYEE",
          goalSheets: {
            some: {
              cycleId: activeCycle.id,
              status: "APPROVED",
              goals: {
                none: {
                  achievements: { some: { quarter, status: { not: "NOT_STARTED" } } },
                },
              },
            },
          },
        },
        include: { manager: { include: { manager: true } } },
      });

      for (const emp of employees) {
        const entityId = `${emp.id}:${quarter}`;
        const existing = await db.escalationEvent.findFirst({
          where: { ruleId: rule.id, entityId, resolvedAt: null },
        });

        if (!existing) {
          await db.escalationEvent.create({
            data: {
              ruleId: rule.id,
              entityType: "USER",
              entityId,
              notifLog: { level: 1, l1At: now.toISOString() },
            },
          });
          await escalationEmail(emp.email, `Your ${quarter} check-in is overdue. Please update your achievements.`);
          await notify(emp.id, "escalation", `${quarter} check-in overdue`, "Please update your check-in progress.", `/employee/check-ins/${quarter}`);
          if (emp.manager) {
            await escalationEmail(emp.manager.email, `${emp.name} has not completed their ${quarter} check-in.`);
            await notify(emp.manager.id, "escalation", `Team ${quarter} check-in overdue`, `${emp.name} has not completed their check-in.`, `/manager/check-ins/${quarter}`);
          }
          continue;
        }

        const level = levelFromLog(existing.notifLog);

        if (level === 1) {
          const l1At = levelTimestamp(existing.notifLog, 1);
          if (!l1At || daysSince(l1At) < LEVEL_ESCALATE_DAYS) continue;
          await db.escalationEvent.update({
            where: { id: existing.id },
            data: { notifLog: { ...(existing.notifLog as object), level: 2, l2At: now.toISOString() } },
          });
          const skipLevel = emp.manager?.manager;
          if (skipLevel) {
            await escalationEmail(skipLevel.email, `[Escalation L2] ${emp.name} has not completed their ${quarter} check-in.`);
            await notify(skipLevel.id, "escalation", `Escalation: ${quarter} check-in`, `${emp.name} has not completed their ${quarter} check-in.`, "/admin/users");
          } else {
            const admins = await db.user.findMany({ where: { role: "ADMIN" }, select: { id: true, email: true } });
            for (const admin of admins) {
              await escalationEmail(admin.email, `[Escalation L2] ${emp.name} has not completed their ${quarter} check-in.`);
              await notify(admin.id, "escalation", `Escalation: ${quarter} check-in`, `${emp.name} has not completed their ${quarter} check-in.`, "/admin/users");
            }
          }
        }
      }
    }
  }
}
