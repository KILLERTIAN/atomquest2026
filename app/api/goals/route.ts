import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { GoalSheetSchema, GoalSheetDraftSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope");
  const cycleId = searchParams.get("cycleId");

  if (scope === "team" && (session.user.role === "MANAGER" || session.user.role === "ADMIN")) {
    const where: Record<string, unknown> = {
      employee: { managerId: session.user.id },
    };
    if (cycleId) where.cycleId = cycleId;

    const sheets = await db.goalSheet.findMany({
      where,
      include: { goals: { include: { achievements: true } }, cycle: true, employee: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(sheets);
  }

  const sheets = await db.goalSheet.findMany({
    where: { employeeId: session.user.id },
    include: { goals: { include: { achievements: true } }, cycle: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(sheets);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const schema = body.isDraft ? GoalSheetDraftSchema : GoalSheetSchema;
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { cycleId, goals } = parsed.data;

  const cycle = await db.goalCycle.findUnique({ where: { id: cycleId }, select: { phase: true, isActive: true } });
  if (!cycle) return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
  if (cycle.phase !== "GOAL_SETTING") {
    return NextResponse.json({ error: "Goal sheets can only be created during the GOAL_SETTING phase" }, { status: 409 });
  }
  if (!cycle.isActive) {
    return NextResponse.json({ error: "This cycle is not active" }, { status: 409 });
  }

  const existing = await db.goalSheet.findFirst({
    where: { employeeId: session.user.id, cycleId },
  });
  if (existing) {
    return NextResponse.json({ error: "Goal sheet already exists for this cycle" }, { status: 409 });
  }

  const sheet = await db.goalSheet.create({
    data: {
      employeeId: session.user.id,
      cycleId,
      goals: {
        create: goals.map((g) => ({
          thrustArea: g.thrustArea,
          title: g.title,
          description: g.description,
          uomType: g.uomType,
          targetValue: g.targetValue ?? null,
          targetDate: g.targetDate ? new Date(g.targetDate) : null,
          weightage: g.weightage,
        })),
      },
    },
    include: { goals: true },
  });

  await logAudit("GoalSheet", sheet.id, "CREATED", session.user.id, {}, { cycleId, goalCount: goals.length });

  return NextResponse.json(sheet, { status: 201 });
}
