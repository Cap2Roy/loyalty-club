import { prisma } from "@/lib/prisma";
import { requireOwner, withErrors, ok, bad } from "@/lib/api";

export async function DELETE(_req: Request, { params }: { params: Promise<{ businessId: string; inviteId: string }> }) {
  const { businessId, inviteId } = await params;
  return withErrors(async () => {
    await requireOwner(businessId);
    const invite = await prisma.staffInvite.findUnique({ where: { id: inviteId } });
    if (!invite || invite.businessId !== businessId) return bad("Invite not found", 404);
    if (invite.acceptedAt) return bad("Invite already accepted", 400);
    await prisma.staffInvite.delete({ where: { id: inviteId } });
    return ok({ deleted: true });
  });
}
