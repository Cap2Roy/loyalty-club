import { prisma } from "@/lib/prisma";
import { requireStaff, withErrors, readJson, ok, bad } from "@/lib/api";
import { recordCheckin } from "@/lib/loyalty";

export async function POST(req: Request, { params }: { params: Promise<{ businessId: string }> }) {
  return withErrors(async () => {
    const { businessId } = await params;
    const { user } = await requireStaff(businessId);
    const body = await readJson<{ membershipId?: string; spend?: number }>(req);
    const membershipId = body.membershipId?.trim();
    const spend = Number(body.spend);
    if (!membershipId) return bad("membershipId is required", 400);
    if (!Number.isFinite(spend) || spend < 0) return bad("spend must be a non-negative number", 400);
    const membership = await prisma.membership.findUnique({ where: { id: membershipId } });
    if (!membership || membership.businessId !== businessId) return bad("Membership not found", 404);
    const result = await recordCheckin(membershipId, spend, user.id);
    return ok({ delta: result.delta, points: result.membership.points, membership: result.membership });
  });
}
