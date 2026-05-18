import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      name:     true,
      email:    true,
      role:     true,
      manager:  { select: { name: true } },
      department: { select: { name: true } },
    },
  });

  if (!user) redirect("/login");

  return (
    <SettingsClient
      user={{
        name:       user.name,
        email:      user.email,
        role:       user.role,
        department: user.department?.name ?? null,
        manager:    user.manager?.name ?? null,
      }}
    />
  );
}
