import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const Body = z.object({
  name: z.string().min(2).optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = Body.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await db.user.update({
    where: { id: session.user.id },
    data: {
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.avatarUrl !== undefined && { avatarUrl: parsed.data.avatarUrl }),
    },
    select: { id: true, name: true, avatarUrl: true },
  });

  return NextResponse.json(updated);
}
