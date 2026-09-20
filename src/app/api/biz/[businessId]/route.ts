import { prisma } from "@/lib/prisma";
import { ok, bad, requireStaff, requireOwner, withErrors, readJson } from "@/lib/api";

type BusinessBody = {
  name?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
};

export async function GET(_req: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  return withErrors(async () => {
    await requireStaff(businessId);
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return bad("Business not found", 404);
    return ok({
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        address: business.address,
        latitude: business.latitude,
        longitude: business.longitude,
      },
    });
  });
}

export async function PUT(req: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  return withErrors(async () => {
    await requireOwner(businessId);
    const body = await readJson<BusinessBody>(req);

    const name = String(body.name ?? "").trim();
    if (!name) return bad("Name is required", 400);
    if (name.length > 100) return bad("Name must be at most 100 characters", 400);

    const address = String(body.address ?? "").trim();
    if (address.length > 300) return bad("Address must be at most 300 characters", 400);

    let latitude: number | null = null;
    let longitude: number | null = null;
    if (body.latitude != null) {
      if (typeof body.latitude !== "number" || !Number.isFinite(body.latitude)) {
        return bad("Latitude must be a valid number", 400);
      }
      if (body.latitude < -90 || body.latitude > 90) {
        return bad("Latitude must be between -90 and 90", 400);
      }
      latitude = body.latitude;
    }
    if (body.longitude != null) {
      if (typeof body.longitude !== "number" || !Number.isFinite(body.longitude)) {
        return bad("Longitude must be a valid number", 400);
      }
      if (body.longitude < -180 || body.longitude > 180) {
        return bad("Longitude must be between -180 and 180", 400);
      }
      longitude = body.longitude;
    }
    // Both or neither — can't set one without the other.
    if ((body.latitude != null) !== (body.longitude != null)) {
      return bad("Latitude and longitude must both be set or both blank", 400);
    }

    const business = await prisma.business.update({
      where: { id: businessId },
      data: { name, address, latitude, longitude },
    });
    return ok({ business });
  });
}
