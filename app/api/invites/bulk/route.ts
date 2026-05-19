import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { bulkInviteEmail } from "@/lib/email";
import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";

const Body = z.object({
  emails: z.array(z.string().email()).min(1).max(100),
  managerId: z.string().optional().nullable(),
  role: z.enum(["EMPLOYEE", "MANAGER"]).default("EMPLOYEE"),
  force: z.boolean().default(false),
});

export async function POST(req: Request) {
  const APP_URL = new URL(req.url).origin;
  const session = await auth();
  if (!session || (session.user.role !== "MANAGER" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = Body.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { emails, managerId, force } = parsed.data;

  // Resolve which manager's token to embed in the link
  const tokenOwnerId = managerId ?? session.user.id;
  const tokenOwner = await db.user.findUnique({
    where: { id: tokenOwnerId },
    select: { id: true, name: true, inviteToken: true },
  });
  if (!tokenOwner) return NextResponse.json({ error: "Manager not found" }, { status: 404 });

  // Reuse existing token or generate a fresh one
  let inviteToken = tokenOwner.inviteToken;
  if (!inviteToken) {
    inviteToken = randomUUID();
    await db.user.update({ where: { id: tokenOwnerId }, data: { inviteToken } });
  }

  const inviterName = tokenOwner.name;
  const sent: string[] = [];
  const skipped: string[] = [];

  for (const email of emails) {
    try {
      const existing = await db.user.findUnique({ where: { email } });
      if (existing && !force) { skipped.push(`${email} (already registered)`); continue; }

      const signupUrl = `${APP_URL}/login?invite=${inviteToken}&email=${encodeURIComponent(email)}`;
      await bulkInviteEmail(email, "", inviterName, signupUrl);
      sent.push(email);
    } catch {
      skipped.push(email);
    }
  }

  return NextResponse.json({ created: sent.length, failed: skipped });
}
