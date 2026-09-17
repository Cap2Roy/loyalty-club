import { prisma } from "@/lib/prisma";
import { ok, withErrors, requireUser } from "@/lib/api";

export async function GET() {
  return withErrors(async () => {
    const user = await requireUser();
    const memberships = await prisma.membership.findMany({
      where: { userId: user.id },
      orderBy: { joinedAt: "asc" },
      include: { business: { include: { program: true } } },
    });
    return ok({
      memberships: memberships.map((m) => ({
        id: m.id,
        businessId: m.businessId,
        points: m.points,
        lifetimeEarned: m.lifetimeEarned,
        lifetimeSpend: m.lifetimeSpend,
        referralCode: m.referralCode,
        business: {
          id: m.business.id,
          name: m.business.name,
          slug: m.business.slug,
          program: m.business.program
            ? {
                pointsName: m.business.program.pointsName,
                earnRate: m.business.program.earnRate,
                minRedeem: m.business.program.minRedeem,
                currency: m.business.program.currency,
                tierNames: m.business.program.tierNames,
                tierThresholds: m.business.program.tierThresholds,
              }
            : null,
        },
      })),
    });
  });
}
