import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { goalUnlockedEmail } from "@/lib/email";
import { notify } from "@/lib/notify";
import { NextResponse } from "next/server";

export async function POST(_req: Request, ctx: { params: Promise<Record<string, string>> }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;

  const sheet = await db.goalSheet.findUnique({
    where: { id },
    include: { employee: true },
  });
  if (!sheet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.goal.updateMany({ where: { sheetId: id }, data: { isLocked: false } });
  await logAudit("GoalSheet", id, "UNLOCKED", session.user.id);
  await goalUnlockedEmail(sheet.employee.email, sheet.employee.name);
  await notify(sheet.employee.id, "unlock", "Goal sheet unlocked", "An admin unlocked your goals. You can now edit and resubmit.", `/employee/goals/${id}`);

  return NextResponse.json({ success: true });
}
