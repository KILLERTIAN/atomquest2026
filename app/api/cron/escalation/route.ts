import { runEscalationEngine } from "@/lib/escalation";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await runEscalationEngine();
  return NextResponse.json({ success: true, ran: new Date().toISOString() });
}
