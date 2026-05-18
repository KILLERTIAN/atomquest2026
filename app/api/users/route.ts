import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { UserCreateSchema } from "@/lib/validations";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { welcomeEmail } from "@/lib/email";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await db.user.findMany({
    select: {
      id: true, email: true, name: true, role: true,
      manager: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
      createdAt: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = UserCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { password, ...rest } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await db.user.create({
    data: { ...rest, passwordHash },
  });

  await welcomeEmail(user.email, user.name, user.role);

  return NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role }, { status: 201 });
}
