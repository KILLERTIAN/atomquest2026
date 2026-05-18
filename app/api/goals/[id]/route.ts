import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { GoalSheetSchema, GoalSheetDraftSchema } from "@/lib/validations";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET(_req: Request, ctx: { params: Promise<Record<string, string>> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const sheet = await db.goalSheet.findUnique({
    where: { id },
    include: { goals: { include: { achievements: true } }, cycle: true, employee: true },
  });

  if (!sheet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const canView =
    session.user.role === "ADMIN" ||
    sheet.employeeId === session.user.id ||
    (session.user.role === "MANAGER" && sheet.employee.managerId === session.user.id);

  if (!canView) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(sheet);
}

export async function PUT(req: Request, ctx: { params: Promise<Record<string, string>> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const sheet = await db.goalSheet.findUnique({ where: { id }, include: { goals: true } });
  if (!sheet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (sheet.employeeId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (sheet.status === "APPROVED" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Sheet is locked" }, { status: 409 });
  }

  const body = await req.json();
  const schema = body.isDraft ? GoalSheetDraftSchema : GoalSheetSchema;

  // Strip extra fields before validating so Zod doesn't reject id/isShared
  const goalsForValidation = body.goals?.map(({ id: _id, isShared: _s, ...rest }: Record<string, unknown>) => rest);
  const parsed = schema.safeParse({ ...body, goals: goalsForValidation });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { goals } = parsed.data;

  // Annotate each validated goal with the id/isShared the client sent
  const GoalWithMeta = z.object({ id: z.string().optional(), isShared: z.boolean().optional() });
  const incomingMeta: Array<{ id?: string; isShared?: boolean }> = (body.goals ?? []).map(
    (g: unknown) => GoalWithMeta.parse(g)
  );

  // Delete only non-shared goals — shared goals must keep isShared + primaryGoalId intact
  await db.goal.deleteMany({ where: { sheetId: id, isShared: false } });

  for (let i = 0; i < goals.length; i++) {
    const g = goals[i];
    const meta = incomingMeta[i] ?? {};

    if (meta.isShared && meta.id) {
      // Shared goal: only update weightage, nothing else
      await db.goal.update({ where: { id: meta.id }, data: { weightage: g.weightage } });
    } else {
      // Regular goal: create fresh
      await db.goal.create({
        data: {
          sheetId: id,
          thrustArea: g.thrustArea,
          title: g.title,
          description: g.description,
          uomType: g.uomType,
          targetValue: g.targetValue ?? null,
          targetDate: g.targetDate ? new Date(g.targetDate) : null,
          weightage: g.weightage,
        },
      });
    }
  }

  const updated = await db.goalSheet.findUnique({
    where: { id },
    include: { goals: true },
  });

  // Ensure status is reset to DRAFT if it was RETURNED
  await db.goalSheet.update({ where: { id }, data: { status: "DRAFT" } });

  return NextResponse.json(updated);
}
