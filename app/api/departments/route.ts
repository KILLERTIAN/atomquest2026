import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const departments = await db.department.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
  return NextResponse.json(departments);
}
