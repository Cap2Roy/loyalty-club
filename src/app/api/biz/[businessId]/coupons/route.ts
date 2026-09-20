import { prisma } from "@/lib/prisma";
import { ok, requireStaff, withErrors } from "@/lib/api";

export async function GET(_req: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  return withErrors(async () => {
    await requireStaff(businessId);

    const coupons = await prisma.coupon.findMany({
      where: { businessId },
      orderBy: { issuedAt: "desc" },
      include: {
        membership: { include: { user: { select: { email: true } } } },
        reward: { select: { title: true } },
      },
    });

    const now = new Date();
    return ok({
      coupons: coupons.map((c) => {
        const expired = c.status === "ACTIVE" && c.expiresAt && c.expiresAt < now;
        return {
          id: c.id,
          code: c.code,
          title: c.reward?.title ?? "Reward",
          memberEmail: c.membership.user.email,
          status: expired ? "EXPIRED" : c.status,
          issuedAt: c.issuedAt.toISOString(),
          expiresAt: c.expiresAt?.toISOString() ?? null,
          redeemedAt: c.redeemedAt?.toISOString() ?? null,
        };
      }),
    });
  });
}
