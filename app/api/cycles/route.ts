import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CycleSchema } from "@/lib/validations";
import { cycleOpenedEmail } from "@/lib/email";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cycles = await db.goalCycle.findMany({
    orderBy: [{ year: "desc" }, { openDate: "desc" }],
    include: { _count: { select: { goalSheets: true } } },
  });

  return NextResponse.json(cycles);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = CycleSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const cycle = await db.goalCycle.create({
    data: {
      ...parsed.data,
      openDate: new Date(parsed.data.openDate),
      closeDate: new Date(parsed.data.closeDate),
    },
  });

  const employees = await db.user.findMany({
    where: { role: "EMPLOYEE" },
    select: { email: true, name: true },
  });

  const cycleLabel = `${cycle.phase.replace("_", " ")} ${cycle.year}`;
  const deadline = new Date(cycle.closeDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  await Promise.all(
    employees.map((emp) => cycleOpenedEmail(emp.email, emp.name, cycleLabel, deadline))
  );

  return NextResponse.json(cycle, { status: 201 });
}
