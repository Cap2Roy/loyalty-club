import { prisma } from "@/lib/prisma";
import { ok, withErrors, requireUser, readJson, ApiError } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

type VerifyBody = { code?: string };

export async function POST(req: Request) {
  return withErrors(async () => {
    const user = await requireUser();

    // Rate limit: max 5 verification attempts per 10 minutes per user.
    const rl = rateLimit(`otp-verify:${user.id}`, 5, 10 * 60 * 1000);
    if (!rl.allowed) throw new ApiError(429, `Too many attempts. Try again in ${rl.retryAfter}s.`);

    const { code } = await readJson<VerifyBody>(req);
    const submitted = (code ?? "").trim();

    if (!submitted) throw new ApiError(400, "Verification code is required");
    if (!user.phoneVerifyCode || !user.phoneVerifyExpiresAt) {
      throw new ApiError(400, "No verification code was sent. Request a new code.");
    }
    if (user.phoneVerifyExpiresAt < new Date()) {
      throw new ApiError(400, "Verification code has expired. Request a new code.");
    }
    if (user.phoneVerifyCode !== submitted) {
      throw new ApiError(400, "Invalid verification code");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        phoneVerified: true,
        phoneVerifyCode: null,
        phoneVerifyExpiresAt: null,
      },
    });

    return ok({ ok: true, phone: user.phone, verified: true });
  });
}
