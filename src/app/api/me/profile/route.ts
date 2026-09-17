import { prisma } from "@/lib/prisma";
import { ok, bad, requireUser, withErrors, readJson } from "@/lib/api";
import bcrypt from "bcryptjs";

type ProfileBody = {
  name?: string;
  phone?: string;
};

export async function PUT(req: Request) {
  return withErrors(async () => {
    const user = await requireUser();
    const body = await readJson<ProfileBody>(req);
    const name = (body.name ?? "").trim();
    const phone = (body.phone ?? "").trim();
    if (name.length > 100) return bad("Name must be at most 100 characters", 400);
    if (phone.length > 20) return bad("Phone must be at most 20 characters", 400);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { name, phone },
      select: { id: true, email: true, name: true, phone: true },
    });
    return ok({ user: updated });
  });
}
