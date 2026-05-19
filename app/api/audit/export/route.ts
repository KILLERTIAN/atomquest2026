import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    include: { changedBy: { select: { name: true, email: true } } },
    take: 5000,
  });

  const header = ["Timestamp", "Entity Type", "Entity ID", "Action", "Changed By", "Changed By Email", "Old Value", "New Value"];
  const rows = logs.map((l) => [
    l.createdAt.toISOString(),
    l.entityType,
    l.entityId,
    l.action,
    l.changedBy.name,
    l.changedBy.email,
    l.oldValue ? JSON.stringify(l.oldValue) : "",
    l.newValue ? JSON.stringify(l.newValue) : "",
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="audit-log-${Date.now()}.csv"`,
    },
  });
}
