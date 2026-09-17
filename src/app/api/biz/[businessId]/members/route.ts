import { prisma } from "@/lib/prisma";
import { ok, requireStaff, withErrors } from "@/lib/api";
import { computeTier } from "@/lib/loyalty";

export async function GET(_req: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  return withErrors(async () => {
    await requireStaff(businessId);
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: { program: true },
    });
    if (!business) return ok({ error: "Business not found" }, 404);
    const memberships = await prisma.membership.findMany({
      where: { businessId },
      orderBy: { joinedAt: "asc" },
      include: { user: true },
    });
    return ok({
      members: memberships.map((m) => ({
        membershipId: m.id,
        email: m.user.email,
        points: m.points,
        lifetimeSpend: m.lifetimeSpend,
        tier: computeTier(business.program ?? { tierNames: "Member", tierThresholds: "" }, m.lifetimeSpend).name,
        joinedAt: m.joinedAt.toISOString(),
      })),
    });
  });
}
