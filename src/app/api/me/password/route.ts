import { prisma } from "@/lib/prisma";
import { ok, bad, requireUser, withErrors, readJson } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";

type PasswordBody = {
  currentPassword?: string;
  newPassword?: string;
};

export async function POST(req: Request) {
  return withErrors(async () => {
    const user = await requireUser();

    // Rate limit: 5 password changes per hour per user.
    const rl = rateLimit(`pw-change:${user.id}`, 5, 60 * 60 * 1000);
    if (!rl.allowed) return bad(`Too many attempts. Try again in ${rl.retryAfter}s.`, 429);

    const body = await readJson<PasswordBody>(req);
    const currentPassword = body.currentPassword ?? "";
    const newPassword = body.newPassword ?? "";

    if (!newPassword || newPassword.length < 8) {
      return bad("New password must be at least 8 characters", 400);
    }
    if (Buffer.byteLength(newPassword, "utf8") > 72) {
      return bad("Password must be at most 72 bytes", 400);
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return bad("Current password is incorrect", 400);
    }

    // Reject same password — forces an actual change.
    if (await bcrypt.compare(newPassword, user.passwordHash)) {
      return bad("New password must be different from your current password", 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, tokenVersion: { increment: 1 } },
    });
    return ok({ success: true });
  });
}
