import { prisma } from "@/lib/prisma";
import { requireStaff, withErrors, readJson, ok, bad } from "@/lib/api";
import { redeemCoupon } from "@/lib/loyalty";

export async function POST(req: Request, { params }: { params: Promise<{ businessId: string }> }) {
  return withErrors(async () => {
    const { businessId } = await params;
    await requireStaff(businessId);
    const body = await readJson<{ code?: string }>(req);
    const code = body.code?.trim();
    if (!code) return bad("code is required", 400);
    const found = await prisma.coupon.findUnique({ where: { code } });
    if (!found) return bad("Coupon not found", 404);
    const coupon = await redeemCoupon(found.id, businessId);
    return ok({ coupon });
  });
}
