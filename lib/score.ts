import type { UomType } from "@prisma/client";

export function computeScore(
  uomType: UomType,
  targetValue: number | null,
  targetDate: Date | null,
  actualValue: number | null,
  actualDate: Date | null
): number | null {
  switch (uomType) {
    case "NUMERIC_MIN":
      if (targetValue == null || actualValue == null || targetValue === 0) return null;
      return Math.min(actualValue / targetValue, 1.5);

    case "NUMERIC_MAX":
      if (targetValue == null || actualValue == null || actualValue === 0) return null;
      return Math.min(targetValue / actualValue, 1.5);

    case "TIMELINE":
      if (!targetDate) return null;
      if (!actualDate) return 0;
      return actualDate <= targetDate ? 1.0 : 0.0;

    case "ZERO":
      if (actualValue == null) return null;
      return actualValue === 0 ? 1.0 : 0.0;

    default:
      return null;
  }
}
