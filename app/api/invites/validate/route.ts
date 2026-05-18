import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const manager = await db.user.findUnique({ where: { inviteToken: token }, select: { id: true, name: true } });
  if (!manager) return NextResponse.json({ error: "Invalid or expired invite" }, { status: 404 });

  return NextResponse.json({ managerName: manager.name });
}
