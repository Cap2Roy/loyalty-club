import { prisma } from "@/lib/prisma";
import { ok, bad, requireOwner, withErrors, readJson } from "@/lib/api";

type RewardPatchBody = {
  title?: string;
  description?: string;
  cost?: number;
  expiresInDays?: number | null;
  active?: boolean;
};

export async function PATCH(req: Request, { params }: { params: Promise<{ businessId: string; rewardId: string }> }) {
  const { businessId, rewardId } = await params;
  return withErrors(async () => {
    await requireOwner(businessId);
    const reward = await prisma.reward.findUnique({ where: { id: rewardId } });
    if (!reward || reward.businessId !== businessId) return bad("Reward not found", 404);
    const body = await readJson<RewardPatchBody>(req);

    const data: { title?: string; description?: string; cost?: number; expiresInDays?: number | null; active?: boolean } = {};
    if (body.title !== undefined) {
      const title = String(body.title).trim();
      if (!title) return bad("Title is required", 400);
      data.title = title;
    }
    if (body.description !== undefined) data.description = String(body.description).trim();
    if (body.cost !== undefined) {
      if (typeof body.cost !== "number" || !Number.isInteger(body.cost) || body.cost <= 0) {
        return bad("Cost must be a positive integer", 400);
      }
      data.cost = body.cost;
    }
    if (body.expiresInDays !== undefined) {
      if (body.expiresInDays !== null && (!Number.isInteger(body.expiresInDays) || body.expiresInDays <= 0)) {
        return bad("Expires in days must be a positive integer or null", 400);
      }
      data.expiresInDays = body.expiresInDays;
    }
    if (body.active !== undefined) {
      if (typeof body.active !== "boolean") return bad("active must be a boolean", 400);
      data.active = body.active;
    }

    const updated = await prisma.reward.update({ where: { id: rewardId }, data });
    return ok({ reward: updated });
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ businessId: string; rewardId: string }> }) {
  const { businessId, rewardId } = await params;
  return withErrors(async () => {
    await requireOwner(businessId);
    const reward = await prisma.reward.findUnique({ where: { id: rewardId } });
    if (!reward || reward.businessId !== businessId) return bad("Reward not found", 404);
    const issuedCoupons = await prisma.coupon.count({ where: { rewardId } });
    if (issuedCoupons > 0) return bad("Reward has issued coupons; deactivate instead", 400);
    await prisma.reward.delete({ where: { id: rewardId } });
    return ok({ deleted: true });
  });
}