import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { bad, ok, withErrors, readJson, ApiError } from "@/lib/api";
import { createSession } from "@/lib/auth";
import { rateLimit, clientKey } from "@/lib/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LEN = 254;

export async function POST(req: Request) {
  return withErrors(async () => {
    // Rate limit: 5 registrations per hour per IP.
    const rl = rateLimit(clientKey(req, "register"), 5, 60 * 60 * 1000);
    if (!rl.allowed) throw new ApiError(429, `Too many registrations from this address. Try again in ${rl.retryAfter}s.`);

    const { email, password } = await readJson<{ email?: string; password?: string }>(req);
    const normalized = (email ?? "").trim().toLowerCase();
    if (!EMAIL_RE.test(normalized)) return bad("Enter a valid email address", 400);
    if (normalized.length > MAX_EMAIL_LEN) return bad("Email address is too long", 400);

    if (typeof password !== "string" || password.length < 8) {
      return bad("Password must be at least 8 characters", 400);
    }
    // bcrypt silently truncates at 72 bytes; reject longer inputs explicitly.
    if (Buffer.byteLength(password, "utf8") > 72) {
      return bad("Password must be at most 72 bytes", 400);
    }

    const existing = await prisma.user.findUnique({ where: { email: normalized } });
    if (existing) throw new ApiError(409, "An account with this email already exists");

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email: normalized, passwordHash } });
    await createSession(user.id, user.tokenVersion);
    return ok({ user: { id: user.id, email: user.email } });
  });
}
