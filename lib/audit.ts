"use server";

import { db } from "./db";

export async function logAudit(
  entityType: string,
  entityId: string,
  action: string,
  changedById: string,
  oldValue?: unknown,
  newValue?: unknown
) {
  await db.auditLog.create({
    data: {
      entityType,
      entityId,
      action,
      changedById,
      oldValue: oldValue ? (oldValue as object) : undefined,
      newValue: newValue ? (newValue as object) : undefined,
    },
  });
}
