import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { welcomeEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  name:        z.string().min(2),
  email:       z.string().email(),
  password:    z.string().min(6),
  role:        z.enum(["EMPLOYEE", "MANAGER", "ADMIN"]).default("EMPLOYEE"),
  inviteToken: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    }
    const { name, email, password, role, inviteToken } = parsed.data;

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

    let managerId: string | null = null;
    let effectiveRole = role;

    if (inviteToken) {
      const manager = await db.user.findUnique({ where: { inviteToken }, select: { id: true } });
      if (manager) { managerId = manager.id; effectiveRole = "EMPLOYEE"; }
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await db.user.create({ data: { name, email, passwordHash, role: effectiveRole, managerId } });
    await welcomeEmail(email, name, effectiveRole);

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
