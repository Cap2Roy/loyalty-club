import { prisma } from "@/lib/prisma";
import { ok, withErrors, requireUser, ApiError } from "@/lib/api";
import { adjustPoints } from "@/lib/loyalty";

export async function POST(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  return withErrors(async () => {
    const user = await requireUser();
    const { code } = await params;

    // Require phone verification before referral bonuses can be claimed.
    // This prevents self-farming via unverified throwaway accounts.
    if (!user.phoneVerified) {
      throw new ApiError(400, "Verify your phone number before claiming a referral code");
    }

    const referral = await prisma.crossStoreReferral.findUnique({
      where: { code },
    });
    if (!referral) throw new ApiError(404, "Invalid referral code");
    if (referral.status === "CLAIMED") throw new ApiError(400, "This referral code has already been claimed");
    if (referral.expiresAt && referral.expiresAt < new Date()) throw new ApiError(400, "This referral code has expired");
    if (referral.referrerId === user.id) throw new ApiError(400, "You cannot claim your own referral");
    if (referral.refereeId && referral.refereeId !== user.id) throw new ApiError(400, "This referral code has already been claimed");
    if (!referral.targetBusinessId) throw new ApiError(400, "Referral has no target business");
    if (!referral.sourceBusinessId) throw new ApiError(400, "Referral has no source business");

    // Atomically claim the referral via a conditional update — only succeeds
    // if the status is still PENDING, preventing race conditions where two
    // concurrent requests both pass the initial check-then-act.
    const claimed = await prisma.crossStoreReferral.updateMany({
      where: { id: referral.id, status: "PENDING" },
      data: { refereeId: user.id, status: "CLAIMED", claimedAt: new Date() },
    });

    if (claimed.count === 0) {
      throw new ApiError(400, "This referral code has already been claimed");
    }

    // Award referee bonus: ensure membership at target business, then adjust points.
    const existingTargetMembership = await prisma.membership.findUnique({
      where: { userId_businessId: { userId: user.id, businessId: referral.targetBusinessId } },
    });
    const refereeMembership =
      existingTargetMembership ??
      (await prisma.membership.create({ data: { userId: user.id, businessId: referral.targetBusinessId } }));
    await adjustPoints(refereeMembership.id, referral.refereeBonus, "Referral bonus");

    // Award referrer bonus at source business.
    const referrerMembership = await prisma.membership.findUnique({
      where: { userId_businessId: { userId: referral.referrerId, businessId: referral.sourceBusinessId } },
    });
    if (referrerMembership) {
      await adjustPoints(referrerMembership.id, referral.bonusPoints, "Cross-store referral bonus");
    }

    return ok({ ok: true, refereeBonus: referral.refereeBonus, referrerBonus: referral.bonusPoints });
  });
}
