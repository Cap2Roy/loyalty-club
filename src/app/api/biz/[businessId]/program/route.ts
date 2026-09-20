import { prisma } from "@/lib/prisma";
import { ok, bad, requireOwner, withErrors, readJson } from "@/lib/api";

type ProgramBody = {
  pointsName?: string;
  earnRate?: number;
  minRedeem?: number;
  currency?: string;
  tierNames?: string;
  tierThresholds?: string;
};

export async function PUT(req: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  return withErrors(async () => {
    await requireOwner(businessId);
    const body = await readJson<ProgramBody>(req);

    const pointsName = String(body.pointsName ?? "").trim();
    if (!pointsName) return bad("pointsName is required", 400);
    if (pointsName.length > 30) return bad("pointsName must be at most 30 characters", 400);
    const currency = String(body.currency ?? "").trim();
    if (!currency) return bad("currency is required", 400);
    if (currency.length > 10) return bad("currency must be at most 10 characters", 400);
    const earnRate = body.earnRate;
    if (typeof earnRate !== "number" || !Number.isInteger(earnRate) || earnRate <= 0) {
      return bad("earnRate must be a positive integer", 400);
    }
    const minRedeem = body.minRedeem;
    if (typeof minRedeem !== "number" || !Number.isInteger(minRedeem) || minRedeem < 0) {
      return bad("minRedeem must be a non-negative integer", 400);
    }
    const tierNames = String(body.tierNames ?? "").trim();
    if (!tierNames) return bad("tierNames is required", 400);
    const names = tierNames.split(",").map((s) => s.trim()).filter(Boolean);
    if (names.length === 0) return bad("tierNames must contain at least one tier", 400);
    const thresholds = String(body.tierThresholds ?? "").trim();
    let parsedThresholds: number[] = [];
    if (thresholds !== "") {
      parsedThresholds = thresholds.split(",").map((s) => parseFloat(s.trim()));
      if (parsedThresholds.some((n) => Number.isNaN(n))) return bad("tierThresholds must be numbers", 400);
      if (parsedThresholds.length !== names.length - 1) {
        return bad("tierThresholds must have exactly one fewer entry than tierNames", 400);
      }
    } else if (names.length > 1) {
      return bad("tierThresholds must have exactly one fewer entry than tierNames", 400);
    }

    const program = await prisma.program.upsert({
      where: { businessId },
      create: { businessId, pointsName, earnRate, minRedeem, currency, tierNames, tierThresholds: thresholds },
      update: { pointsName, earnRate, minRedeem, currency, tierNames, tierThresholds: thresholds },
    });
    return ok({ program });
  });
}
