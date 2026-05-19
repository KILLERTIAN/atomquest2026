import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const Body = z.object({
  goalSheetId: z.string(),
  quarter: z.enum(["Q1", "Q2", "Q3", "Q4"]),
  comment: z.string().min(1),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session || (session.user.role !== "MANAGER" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = Body.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  if (session.user.role === "MANAGER") {
    const sheet = await db.goalSheet.findUnique({
      where: { id: parsed.data.goalSheetId },
      include: { employee: { select: { managerId: true } } },
    });
    if (!sheet || sheet.employee.managerId !== session.user.id) {
      return NextResponse.json({ error: "Not your direct report's sheet" }, { status: 403 });
    }
  }

  const comment = await db.checkinComment.create({
    data: {
      ...parsed.data,
      managerId: session.user.id,
    },
  });

  return NextResponse.json(comment, { status: 201 });
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const goalSheetId = searchParams.get("goalSheetId");
  const quarter = searchParams.get("quarter");

  if (session.user.role === "MANAGER" && goalSheetId) {
    const sheet = await db.goalSheet.findUnique({
      where: { id: goalSheetId },
      include: { employee: { select: { managerId: true } } },
    });
    if (!sheet || sheet.employee.managerId !== session.user.id) {
      return NextResponse.json({ error: "Not your direct report's sheet" }, { status: 403 });
    }
  }

  const comments = await db.checkinComment.findMany({
    where: {
      ...(goalSheetId ? { goalSheetId } : {}),
      ...(quarter ? { quarter: quarter as "Q1" | "Q2" | "Q3" | "Q4" } : {}),
    },
    include: { manager: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(comments);
}
