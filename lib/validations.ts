import { z } from "zod";

export const GoalSchema = z.object({
  thrustArea: z.string().min(1, "Thrust area is required"),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  uomType: z.enum(["NUMERIC_MIN", "NUMERIC_MAX", "TIMELINE", "ZERO"]),
  targetValue: z.number().optional().nullable(),
  targetDate: z.string().optional().nullable(),
  weightage: z
    .number()
    .min(10, "Minimum weightage is 10%")
    .max(100, "Maximum weightage is 100%"),
});

export const GoalDraftSchema = z.object({
  thrustArea: z.string().optional().default(""),
  title: z.string().max(200).optional().default(""),
  description: z.string().optional(),
  uomType: z.enum(["NUMERIC_MIN", "NUMERIC_MAX", "TIMELINE", "ZERO"]).optional().default("NUMERIC_MIN"),
  targetValue: z.number().optional().nullable(),
  targetDate: z.string().optional().nullable(),
  weightage: z.number().min(0).max(100).optional().default(0),
});

export const GoalSheetSchema = z
  .object({
    cycleId: z.string().min(1, "Cycle is required"),
    goals: z
      .array(GoalSchema)
      .min(1, "At least one goal is required")
      .max(8, "Maximum 8 goals allowed"),
  })
  .refine(
    (data) => {
      const total = data.goals.reduce((sum, g) => sum + g.weightage, 0);
      return Math.abs(total - 100) < 0.01;
    },
    { message: "Total weightage must equal 100%", path: ["goals"] }
  );

export const GoalSheetDraftSchema = z.object({
  cycleId: z.string().min(1, "Cycle is required"),
  goals: z.array(GoalDraftSchema).min(1).max(8),
  isDraft: z.literal(true),
});

export const AchievementSchema = z.object({
  actualValue: z.number().optional().nullable(),
  actualDate: z.string().optional().nullable(),
  status: z.enum(["NOT_STARTED", "ON_TRACK", "COMPLETED"]),
  notes: z.string().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const UserCreateSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(6),
  role: z.enum(["EMPLOYEE", "MANAGER", "ADMIN"]),
  managerId: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
});

export const CycleSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  phase: z.enum(["GOAL_SETTING", "Q1", "Q2", "Q3", "Q4"]),
  openDate: z.string(),
  closeDate: z.string(),
  isActive: z.boolean().default(false),
});

export type GoalFormData = z.infer<typeof GoalSchema>;
export type GoalSheetFormData = z.infer<typeof GoalSheetSchema>;
export type AchievementFormData = z.infer<typeof AchievementSchema>;
