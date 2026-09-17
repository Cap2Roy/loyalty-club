import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";
import { ok, withErrors, requireUser, readJson, ApiError } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

type SendBody = { phone?: string };

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_PHONE_LEN = 20;

function generateCode(): string {
  // 6-digit zero-padded code in [000000, 999999] using a CSPRNG.
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export async function POST(req: Request) {
  return withErrors(async () => {
    const user = await requireUser();

    // Rate limit: 1 OTP request per 60 seconds per user.
    const rl = rateLimit(`otp:${user.id}`, 1, 60 * 1000);
    if (!rl.allowed) throw new ApiError(429, `Please wait ${rl.retryAfter}s before requesting another code.`);

    const { phone } = await readJson<SendBody>(req);
    const normalized = (phone ?? "").trim();

    if (!normalized) throw new ApiError(400, "Phone number is required");
    if (normalized.length < 10) throw new ApiError(400, "Enter a valid phone number (at least 10 digits)");
    if (normalized.length > MAX_PHONE_LEN) throw new ApiError(400, "Phone number is too long");

    const code = generateCode();
    const expiresAt = new Date(Date.now() + CODE_TTL_MS);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        phone: normalized,
        phoneVerifyCode: code,
        phoneVerifyExpiresAt: expiresAt,
        // A new (or changed) number must be re-verified.
        phoneVerified: false,
      },
    });

    // Only surface the code in non-production environments (dev/test).
    // In production a real SMS gateway would deliver it out-of-band.
    if (process.env.NODE_ENV !== "production") {
      return ok({ ok: true, devCode: code, expiresIn: CODE_TTL_MS });
    }
    return ok({ ok: true, expiresIn: CODE_TTL_MS });
  });
}
