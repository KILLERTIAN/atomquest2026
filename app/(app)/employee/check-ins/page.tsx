import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CheckInsOverviewClient } from "./CheckInsOverviewClient";

const DEMO_EMAILS = ["emp@demo.com", "manager@demo.com", "admin@demo.com"];

export default async function CheckInsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const isDemo = DEMO_EMAILS.includes(session.user.email ?? "");
  return <CheckInsOverviewClient isDemo={isDemo} />;
}
