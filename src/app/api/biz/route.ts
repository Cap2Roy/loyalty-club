import { prisma } from "@/lib/prisma";
import { ok, bad, requireUser, withErrors, readJson } from "@/lib/api";
import { programDefaults } from "@/lib/loyalty";

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export async function GET() {
  return withErrors(async () => {
    const user = await requireUser();
    const rows = await prisma.businessStaff.findMany({
      where: { userId: user.id },
      include: { business: true },
      orderBy: { business: { createdAt: "asc" } },
    });
    return ok({
      businesses: rows.map((row) => ({
        id: row.business.id,
        name: row.business.name,
        slug: row.business.slug,
        role: row.role,
      })),
    });
  });
}

export async function POST(req: Request) {
  return withErrors(async () => {
    const user = await requireUser();
    const body = await readJson<{ name?: string }>(req);
    const name = (body.name ?? "").trim();
    if (!name) return bad("Name is required", 400);
    if (name.length > 100) return bad("Name must be at most 100 characters", 400);
    const base = slugify(name);
    if (!base) return bad("Name must contain letters or numbers", 400);

    const taken = await prisma.business.findMany({
      where: { slug: { startsWith: base } },
      select: { slug: true },
    });
    const takenSlugs = new Set(taken.map((t) => t.slug));
    let slug = base;
    for (let i = 2; takenSlugs.has(slug); i++) slug = `${base}-${i}`;

    const business = await prisma.$transaction(async (tx) => {
      const created = await tx.business.create({ data: { name, slug } });
      await tx.businessStaff.create({ data: { userId: user.id, businessId: created.id, role: "OWNER" } });
      await tx.program.create({ data: { businessId: created.id, ...programDefaults() } });
      return created;
    });
    return ok({ business }, 201);
  });
}
