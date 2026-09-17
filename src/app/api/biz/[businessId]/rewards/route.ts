import { prisma } from "@/lib/prisma";
import { ok, bad, requireStaff, requireOwner, withErrors, readJson } from "@/lib/api";

type RewardBody = {
  title?: string;
  description?: string;
  cost?: number;
  expiresInDays?: number | null;
};

export async function GET(_req: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  return withErrors(async () => {
    await requireStaff(businessId);
    const rewards = await prisma.reward.findMany({
      where: { businessId },
      orderBy: { cost: "asc" },
    });
    return ok({ rewards });
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  return withErrors(async () => {
    await requireOwner(businessId);
    const body = await readJson<RewardBody>(req);
    const title = (body.title ?? "").trim();
    if (!title) return bad("Title is required", 400);
    if (title.length > 100) return bad("Title must be at most 100 characters", 400);
    const cost = body.cost;
    if (typeof cost !== "number" || !Number.isInteger(cost) || cost <= 0) {
      return bad("Cost must be a positive integer", 400);
    }
    if (body.expiresInDays != null && (!Number.isInteger(body.expiresInDays) || body.expiresInDays <= 0)) {
      return bad("Expires in days must be a positive integer or blank", 400);
    }
    const description = (body.description ?? "").trim();
    if (description.length > 500) return bad("Description must be at most 500 characters", 400);
    const reward = await prisma.reward.create({ data: { businessId, title, description, cost, expiresInDays: body.expiresInDays ?? null } });
    return ok({ reward }, 201);
  });
}