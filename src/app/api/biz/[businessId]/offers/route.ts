import { prisma } from "@/lib/prisma";
import { ok, bad, requireStaff, requireOwner, withErrors, readJson } from "@/lib/api";

type OfferBody = {
  title?: string;
  description?: string;
  kind?: string;
  discount?: string;
  startsAt?: string;
  endsAt?: string;
};

function parseDate(value: string | undefined): Date | null | string {
  if (value === undefined) return null;
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return "invalid";
  return date;
}

export async function GET(_req: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  return withErrors(async () => {
    await requireStaff(businessId);
    const offers = await prisma.offer.findMany({
      where: { businessId },
      orderBy: [{ active: "desc" }, { startsAt: "asc" }],
    });
    return ok({ offers });
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  return withErrors(async () => {
    await requireOwner(businessId);
    const body = await readJson<OfferBody>(req);
    const title = (body.title ?? "").trim();
    if (!title) return bad("Title is required", 400);
    if (title.length > 100) return bad("Title must be at most 100 characters", 400);
    const kind = body.kind;
    if (kind !== "SALE" && kind !== "PROMO") return bad("kind must be SALE or PROMO", 400);
    const description = (body.description ?? "").trim();
    if (description.length > 500) return bad("Description must be at most 500 characters", 400);
    const discount = (body.discount ?? "").trim();
    if (discount.length > 50) return bad("Discount must be at most 50 characters", 400);
    const startsAt = parseDate(body.startsAt);
    if (startsAt === "invalid") return bad("startsAt must be a valid date", 400);
    const endsAt = parseDate(body.endsAt);
    if (endsAt === "invalid") return bad("endsAt must be a valid date", 400);

    const offer = await prisma.offer.create({
      data: {
        businessId,
        title,
        description,
        kind,
        discount,
        startsAt,
        endsAt,
      },
    });
    return ok({ offer }, 201);
  });
}
