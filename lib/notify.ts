import { db } from "@/lib/db";

export async function notify(
  userId: string,
  type: string,
  title: string,
  message: string,
  link?: string,
) {
  await db.notification.create({
    data: { userId, type, title, message, link: link ?? null },
  });
}
