import { prisma } from "@/lib/prisma";
import { requireOwner, withErrors, readJson, ok, bad } from "@/lib/api";

export async function GET(_req: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  return withErrors(async () => {
    await requireOwner(businessId);
    const invites = await prisma.staffInvite.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      include: { invitee: { select: { email: true } } },
    });
    return ok({ invites });
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  return withErrors(async () => {
    const { user } = await requireOwner(businessId);
    const body = await readJson<{ email?: string }>(req);
    const email = (body.email ?? "").trim().toLowerCase();
    if (!email || !email.includes("@")) return bad("Valid email is required", 400);

    // Don't invite someone who is already staff
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      const alreadyStaff = await prisma.businessStaff.findUnique({
        where: { userId_businessId: { userId: existing.id, businessId } },
      });
      if (alreadyStaff) return bad("That person is already staff", 400);
    }

    const invite = await prisma.staffInvite.create({
      data: { businessId, email, invitedBy: user.id },
    });
    return ok({ invite }, 201);
  });
}
