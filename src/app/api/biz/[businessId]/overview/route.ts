import { prisma } from "@/lib/prisma";
import { ok, requireStaff, withErrors } from "@/lib/api";
import { liveOfferClause } from "@/lib/loyalty";

export async function GET(_req: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  return withErrors(async () => {
    await requireStaff(businessId);

    const [business, memberships, checkins, pointsIssued, activeRewards, activeOffers, totalRevenue, couponsTotal, couponsRedeemed] = await Promise.all([
      prisma.business.findUnique({ where: { id: businessId }, include: { program: true } }),
      prisma.membership.count({ where: { businessId } }),
      prisma.checkin.count({ where: { businessId } }),
      prisma.ledgerEntry.aggregate({
        _sum: { delta: true },
        where: { reason: "EARN", membership: { businessId } },
      }),
      prisma.reward.count({ where: { businessId, active: true } }),
      prisma.offer.count({ where: { businessId, ...liveOfferClause() } }),
      prisma.checkin.aggregate({ _sum: { spend: true }, where: { businessId } }),
      prisma.coupon.count({ where: { businessId } }),
      prisma.coupon.count({ where: { businessId, status: "REDEEMED" } }),
    ]);

    const pointsOutstanding = await prisma.membership.aggregate({
      _sum: { points: true },
      where: { businessId },
    });

    const recentCheckins = await prisma.checkin.findMany({
      where: { businessId },
      orderBy: { at: "desc" },
      take: 10,
      include: { membership: { include: { user: true } } },
    });

    const topMembers = await prisma.membership.findMany({
      where: { businessId },
      orderBy: { points: "desc" },
      take: 5,
      include: { user: true },
    });

    if (!business) return ok({ error: "Business not found" }, 404);

    return ok({
      business: { id: business.id, name: business.name, slug: business.slug },
      program: business.program,
      stats: {
        members: memberships,
        checkins,
        pointsIssued: pointsIssued._sum.delta ?? 0,
        pointsOutstanding: pointsOutstanding._sum.points ?? 0,
        activeRewards,
        activeOffers,
        totalRevenue: totalRevenue._sum.spend ?? 0,
        avgSpendPerVisit: checkins > 0 ? Math.round((totalRevenue._sum.spend ?? 0) / checkins * 100) / 100 : 0,
        couponRedemptionRate: couponsTotal > 0 ? Math.round(couponsRedeemed / couponsTotal * 100) : 0,
      },
      recentCheckins: recentCheckins.map((c) => ({
        id: c.id,
        at: c.at.toISOString(),
        spend: c.spend,
        points: c.points,
        memberEmail: c.membership.user.email,
      })),
      topMembers: topMembers.map((m) => ({
        id: m.id,
        email: m.user.email,
        points: m.points,
        lifetimeSpend: m.lifetimeSpend,
      })),
    });
  });
}
