import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { managerInviteEmail } from "@/lib/email";
import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";

const Body = z.object({
  toEmail: z.string().email().optional(),
  toName: z.string().optional(),
});

export async function POST(req: Request) {
  const APP_URL = new URL(req.url).origin;
  const session = await auth();
  if (!session || (session.user.role !== "MANAGER" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const token = randomUUID();
  await db.user.update({ where: { id: session.user.id }, data: { inviteToken: token } });

  const inviteUrl = `${APP_URL}/login?invite=${token}`;

  if (parsed.data.toEmail) {
    const manager = await db.user.findUnique({ where: { id: session.user.id }, select: { name: true } });
    await managerInviteEmail(parsed.data.toEmail, parsed.data.toName ?? "", manager?.name ?? "your manager", inviteUrl);
  }

  return NextResponse.json({ inviteUrl, token });
}
