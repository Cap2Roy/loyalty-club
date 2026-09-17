import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ok, withErrors, readJson, ApiError } from "@/lib/api";
import { createSession } from "@/lib/auth";
import { rateLimit, clientKey } from "@/lib/rate-limit";

// Precomputed bcrypt hash of "wrong-password" — ensures non-existent users
// still pay the full bcrypt.compare cost, preventing a timing oracle that
// would reveal which emails are registered.
const DUMMY_HASH = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

export async function POST(req: Request) {
  return withErrors(async () => {
    const { email, password } = await readJson<{ email?: string; password?: string }>(req);
    const normalized = (email ?? "").trim().toLowerCase();

    // Rate limit: 10 login attempts per 15 minutes per IP+email.
    const rl = rateLimit(clientKey(req, `login:${normalized}`), 10, 15 * 60 * 1000);
    if (!rl.allowed) throw new ApiError(429, `Too many login attempts. Try again in ${rl.retryAfter}s.`);

    const user = await prisma.user.findUnique({ where: { email: normalized } });

    // Always run bcrypt.compare to avoid a timing oracle for user enumeration.
    const passwordOk = user
      ? await bcrypt.compare(password ?? "", user.passwordHash)
      : (await bcrypt.compare(password ?? "", DUMMY_HASH), false);

    if (!user || !passwordOk) {
      throw new ApiError(401, "Invalid email or password");
    }

    await createSession(user.id, user.tokenVersion);
    return ok({ user: { id: user.id, email: user.email } });
  });
}
