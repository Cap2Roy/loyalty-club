import { prisma } from "@/lib/prisma";
import { ok, bad, requireStaff, withErrors, readJson } from "@/lib/api";
import { adjustPoints } from "@/lib/loyalty";

type AdjustBody = {
  delta?: number;
  note?: string;
};

export async function POST(req: Request, { params }: { params: Promise<{ businessId: string; membershipId: string }> }) {
  const { businessId, membershipId } = await params;
  return withErrors(async () => {
    const { user } = await requireStaff(businessId);
    const membership = await prisma.membership.findUnique({ where: { id: membershipId } });
    if (!membership || membership.businessId !== businessId) return bad("Membership not found", 404);
    const body = await readJson<AdjustBody>(req);
    const delta = body.delta;
    if (typeof delta !== "number" || !Number.isInteger(delta) || delta === 0) {
      return bad("delta must be a non-zero integer", 400);
    }
    const note = (body.note ?? "").trim();
    if (!note) return bad("Note is required", 400);
    if (note.length > 500) return bad("Note must be at most 500 characters", 400);
    const updated = await adjustPoints(membershipId, delta, note, user.id);
    return ok({ membership: updated });
  });
}
