import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { passwordResetEmail } from "@/lib/email";
import crypto from "crypto";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

// In-memory rate limiter: max 3 requests per IP per 10 minutes
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX = 3;
const WINDOW_MS = 10 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > MAX;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ ok: true }); // silently return ok to prevent enumeration
  }
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
