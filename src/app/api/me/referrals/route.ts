import { prisma } from "@/lib/prisma";
import { ok, withErrors, requireUser, readJson, ApiError } from "@/lib/api";

const BONUS_POINTS = 50;
const REFEREE_BONUS = 50;

export async function GET() {
  return withErrors(async () => {
    const user = await requireUser();
    const referrals = await prisma.crossStoreReferral.findMany({
      where: { referrerId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        sourceBusiness: { select: { name: true, slug: true } },
        targetBusiness: { select: { name: true, slug: true } },
      },
    });
    return ok({ referrals });
  });
}

export async function POST(req: Request) {
  return withErrors(async () => {
    const user = await requireUser();
    const { sourceBusinessId, targetBusinessId } = await readJson<{
      sourceBusinessId?: string;
      targetBusinessId?: string;
    }>(req);

    if (!sourceBusinessId || !targetBusinessId) throw new ApiError(400, "sourceBusinessId and targetBusinessId are required");
    if (sourceBusinessId === targetBusinessId) throw new ApiError(400, "Source and target must be different clubs");

    // Referrer must be a member of the source business.
    const sourceMembership = await prisma.membership.findUnique({
      where: { userId_businessId: { userId: user.id, businessId: sourceBusinessId } },
    });
    if (!sourceMembership) throw new ApiError(400, "You are not a member of the source club");

    const [sourceBusiness, targetBusiness] = await Promise.all([
      prisma.business.findUnique({ where: { id: sourceBusinessId } }),
      prisma.business.findUnique({ where: { id: targetBusinessId } }),
    ]);
    if (!sourceBusiness) throw new ApiError(404, "Source business not found");
    if (!targetBusiness) throw new ApiError(404, "Target business not found");

    const referral = await prisma.crossStoreReferral.create({
      data: {
        referrerId: user.id,
        sourceBusinessId,
        targetBusinessId,
        bonusPoints: BONUS_POINTS,
        refereeBonus: REFEREE_BONUS,
        status: "PENDING",
        expiresAt: new Date(Date.now() + 30 * 86400000),
      },
    });
    return ok({ referral }, 201);
  });
}
