import { prisma } from "@/lib/prisma";
import { ok, withErrors } from "@/lib/api";
import { liveOfferClause } from "@/lib/loyalty";
/** Public club directory: every business with program summary, member and active-offer counts. */
export async function GET() {
  return withErrors(async () => {
    const businesses = await prisma.business.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        program: { select: { pointsName: true, currency: true, earnRate: true } },
        _count: { select: { members: true, offers: { where: liveOfferClause() } } },
      },
    });
    return ok({
      businesses: businesses.map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        pointsName: b.program?.pointsName ?? "points",
        currency: b.program?.currency ?? "USD",
        earnRate: b.program?.earnRate ?? 10,
        members: b._count.members,
        activeOffers: b._count.offers,
      })),
    });
  });
}
