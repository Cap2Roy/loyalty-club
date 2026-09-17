import { prisma } from "@/lib/prisma";
import { ok, requireStaff, withErrors } from "@/lib/api";
import { computeTier } from "@/lib/loyalty";

export async function GET(req: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  return withErrors(async () => {
    await requireStaff(businessId);

    const code = new URL(req.url).searchParams.get("code")?.trim() ?? "";
    if (!code) return ok({ error: "Missing code" }, 400);

    const membership = await prisma.membership.findUnique({
      where: { referralCode: code },
      include: { user: true, business: { include: { program: true } } },
    });
    if (membership && membership.businessId === businessId) {
      return ok({
        type: "member",
        membership: {
          id: membership.id,
          points: membership.points,
          userName: membership.user.email,
          tier: computeTier(membership.business.program ?? { tierNames: "Member", tierThresholds: "" }, membership.lifetimeSpend).name,
        },
      });
    }

    const coupon = await prisma.coupon.findUnique({ where: { code }, include: { reward: true, membership: { include: { user: true } } } });
    if (coupon && coupon.businessId === businessId) {
      return ok({
        type: "coupon",
        coupon: {
          id: coupon.id,
          code: coupon.code,
          status: coupon.status,
          rewardTitle: coupon.reward?.title ?? null,
          expiresAt: coupon.expiresAt?.toISOString() ?? null,
          memberEmail: coupon.membership.user.email,
        },
      });
    }

    return ok({ error: "Not found" }, 404);
  });
}