import { prisma } from "@/lib/prisma";
import { requireUser, withErrors, ok } from "@/lib/api";

export async function GET() {
  return withErrors(async () => {
    const user = await requireUser();
    const invites = await prisma.staffInvite.findMany({
      where: { email: user.email, acceptedAt: null },
      orderBy: { createdAt: "desc" },
      include: { business: { select: { name: true, slug: true } } },
    });
    return ok({ invites });
  });
}
