import { prisma } from "@/lib/prisma";
import { ok, withErrors, requireUser, ApiError } from "@/lib/api";

export async function DELETE(_req: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  return withErrors(async () => {
    const user = await requireUser();
    const { membershipId } = await params;

    const membership = await prisma.membership.findUnique({ where: { id: membershipId } });
    if (!membership) throw new ApiError(404, "Membership not found");
    if (membership.userId !== user.id) throw new ApiError(403, "Not your membership");

    await prisma.membership.delete({ where: { id: membershipId } });
    return ok({ deleted: true });
  });
}
