import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { passwordChangedEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  current: z.string().min(1),
  next: z.string().min(6),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user?.passwordHash) return NextResponse.json({ error: "No password set" }, { status: 400 });

  const valid = await bcrypt.compare(parsed.data.current, user.passwordHash);
  if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });

  const passwordHash = await bcrypt.hash(parsed.data.next, 12);
  await db.user.update({ where: { id: user.id }, data: { passwordHash } });
  await logAudit("User", user.id, "PASSWORD_CHANGED", user.id);

  await passwordChangedEmail(user.email, user.name);

  return NextResponse.json({ ok: true });
}
