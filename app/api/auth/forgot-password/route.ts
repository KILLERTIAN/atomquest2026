import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { passwordResetEmail } from "@/lib/email";
import crypto from "crypto";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid email" }, { status: 400 });

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });

  // Always return 200 to prevent email enumeration
  if (!user) return NextResponse.json({ ok: true });

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.user.update({
    where: { id: user.id },
    data: { resetToken: token, resetTokenExpiry: expiry },
  });

  await passwordResetEmail(user.email, user.name, token);

  return NextResponse.json({ ok: true });
}
