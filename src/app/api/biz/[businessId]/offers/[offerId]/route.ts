import { prisma } from "@/lib/prisma";
import { ok, bad, requireOwner, withErrors, readJson } from "@/lib/api";

type OfferPatchBody = {
  active?: boolean;
};

export async function PATCH(req: Request, { params }: { params: Promise<{ businessId: string; offerId: string }> }) {
  const { businessId, offerId } = await params;
  return withErrors(async () => {
    await requireOwner(businessId);
    const offer = await prisma.offer.findUnique({ where: { id: offerId } });
    if (!offer || offer.businessId !== businessId) return bad("Offer not found", 404);
    const body = await readJson<OfferPatchBody>(req);
    if (typeof body.active !== "boolean") return bad("active must be a boolean", 400);
    const updated = await prisma.offer.update({
      where: { id: offerId },
      data: { active: body.active },
    });
    return ok({ offer: updated });
  });
}
