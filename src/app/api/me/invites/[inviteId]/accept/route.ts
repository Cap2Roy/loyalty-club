import { prisma } from "@/lib/prisma";
import { requireUser, withErrors, ok, bad } from "@/lib/api";

export async function POST(_req: Request, { params }: { params: Promise<{ inviteId: string }> }) {
  const { inviteId } = await params;
  return withErrors(async () => {
    const user = await requireUser();
    const invite = await prisma.staffInvite.findUnique({
      where: { id: inviteId },
      include: { business: true },
    });
    if (!invite) return bad("Invite not found", 404);
    if (invite.email !== user.email) return bad("This invite is not for you", 403);
    if (invite.acceptedAt) return bad("Invite already accepted", 400);

    // Create the BusinessStaff link and mark invite as accepted
    await prisma.$transaction([
      prisma.businessStaff.create({
        data: { userId: user.id, businessId: invite.businessId, role: "STAFF" },
      }),
      prisma.staffInvite.update({
        where: { id: inviteId },
        data: { acceptedAt: new Date(), userId: user.id },
      }),
    ]);

    return ok({ accepted: true, businessSlug: invite.business.slug });
  });
}
