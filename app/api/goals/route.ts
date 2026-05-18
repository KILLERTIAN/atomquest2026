import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { GoalSheetSchema, GoalSheetDraftSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  return NextResponse.json(sheet, { status: 201 });
}
