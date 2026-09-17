import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const COOKIE = "loyalty_session";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const rawSecret = process.env.SESSION_SECRET;
if (!rawSecret || rawSecret.length < 32) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set to a random string of at least 32 characters in production.");
  }
  // Dev only — allows convenient local startup without manual config.
  console.warn("WARNING: SESSION_SECRET not set; using ephemeral dev secret. Set SESSION_SECRET before deploying.");
}
const SECRET = rawSecret && rawSecret.length >= 32 ? rawSecret : "dev-ephemeral-do-not-use-in-production-0000";

function sign(payload: string): string {
  const mac = createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${mac}`;
}

function verify(token: string): string | null {
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const payload = token.slice(0, dot);
  const mac = Buffer.from(token.slice(dot + 1));
  const expect = Buffer.from(createHmac("sha256", SECRET).update(payload).digest("base64url"));
  if (mac.length !== expect.length || !timingSafeEqual(mac, expect)) return null;
  return payload;
}

export async function createSession(userId: string, tokenVersion: number) {
  const jar = await cookies();
  jar.set(COOKIE, sign(`${userId}:${tokenVersion}:${Date.now()}`), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function currentUserId(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const payload = verify(token);
  if (!payload) return null;
  const parts = payload.split(":");
  const userId = parts[0];
  const tokenVersion = parts[1];
  const issued = parts[2];
  if (!userId || tokenVersion === undefined || !issued) return null;

  // Server-side session expiry (cookie maxAge is client-controlled).
  const age = Date.now() - Number(issued);
  if (Number.isNaN(age) || age > MAX_AGE_MS || age < 0) return null;

  // Validate token version against the user's current version.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tokenVersion: true },
  });
  if (!user) return null;
  if (user.tokenVersion !== Number(tokenVersion)) return null;

  return userId;
}

export async function currentUser() {
  const userId = await currentUserId();
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}
