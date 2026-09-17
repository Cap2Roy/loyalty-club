import { prisma } from "@/lib/prisma";
import { ok, withErrors, requireUser, readJson, ApiError } from "@/lib/api";

export async function POST(req: Request) {
  return withErrors(async () => {
    const user = await requireUser();
    const { slug } = await readJson<{ slug?: string }>(req);
    const normalized = (slug ?? "").trim().toLowerCase();
    if (!normalized) throw new ApiError(400, "Slug is required");

    const business = await prisma.business.findUnique({ where: { slug: normalized } });
    if (!business) throw new ApiError(404, "Business not found");

    const existing = await prisma.membership.findUnique({
      where: { userId_businessId: { userId: user.id, businessId: business.id } },
    });
    if (existing) return ok({ membership: existing });

    const membership = await prisma.membership.create({
      data: { userId: user.id, businessId: business.id },
      include: { business: { include: { program: true } } },
    });
    return ok({ membership });
  });
}
