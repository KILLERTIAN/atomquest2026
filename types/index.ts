export type { Role, CyclePhase, SheetStatus, UomType, AchievementStatus, EscalationTrigger } from "@prisma/client";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: import("@prisma/client").Role;
}

export interface GoalFormData {
  thrustArea: string;
  title: string;
  description?: string;
  uomType: import("@prisma/client").UomType;
  targetValue?: number;
  targetDate?: string;
  weightage: number;
}

export interface GoalSheetFormData {
  cycleId: string;
  goals: GoalFormData[];
}

export interface AchievementUpdateData {
  actualValue?: number;
  actualDate?: string;
  status: import("@prisma/client").AchievementStatus;
  notes?: string;
}
