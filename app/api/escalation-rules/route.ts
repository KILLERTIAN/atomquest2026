import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { NextResponse } from "next/server";
import { z } from "zod";

const RuleSchema = z.object({
  trigger: z.enum(["SUBMISSION", "APPROVAL", "CHECKIN"]),
  daysThreshold: z.number().int().min(1).max(365),
  isActive: z.boolean().default(true),
  description: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const rules = await db.escalationRule.findMany({ orderBy: { trigger: "asc" } });
  return NextResponse.json(rules);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const parsed = RuleSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const rule = await db.escalationRule.create({ data: parsed.data });
  await logAudit("EscalationRule", rule.id, "CREATED", session.user.id, {}, parsed.data);
  return NextResponse.json(rule, { status: 201 });
}

const PatchSchema = z.object({
  daysThreshold: z.number().int().min(1).max(365).optional(),
  isActive: z.boolean().optional(),
  description: z.string().optional(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const body = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const existing = await db.escalationRule.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await db.escalationRule.update({ where: { id }, data: parsed.data });
  await logAudit("EscalationRule", id, "UPDATED", session.user.id, existing, parsed.data);
  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const existing = await db.escalationRule.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.escalationRule.delete({ where: { id } });
  await logAudit("EscalationRule", id, "DELETED", session.user.id, existing, {});
  return NextResponse.json({ ok: true });
}
