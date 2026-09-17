import { prisma } from "@/lib/prisma";
import { ok, withErrors, requireUser, readJson, ApiError } from "@/lib/api";
import { redeemReward } from "@/lib/loyalty";

export async function POST(req: Request) {
  return withErrors(async () => {
    const user = await requireUser();
    const { membershipId, rewardId } = await readJson<{ membershipId?: string; rewardId?: string }>(req);
    if (!membershipId || !rewardId) throw new ApiError(400, "membershipId and rewardId are required");

    const membership = await prisma.membership.findUnique({ where: { id: membershipId } });
    if (!membership) throw new ApiError(404, "Membership not found");
    if (membership.userId !== user.id) throw new ApiError(403, "Not your membership");

    const { coupon } = await redeemReward(membershipId, rewardId);
    return ok({ coupon });
  });
}
