import { NextResponse } from "next/server";
import { prisma } from "./prisma";
import { currentUserId } from "./auth";

/** Thrown by guards and engine; converted to a JSON error response by withErrors. */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

async function authedUser() {
  const userId = await currentUserId();
  if (!userId) throw new ApiError(401, "Not signed in");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(401, "Not signed in");
  return user;
}

/** Signed-in user (any role). Throws ApiError on failure. */
export async function requireUser() {
  return authedUser();
}

/** Signed-in user who is staff of the business (owner or staff role). Throws ApiError. */
export async function requireStaff(businessId: string) {
  const user = await authedUser();
  const staff = await prisma.businessStaff.findUnique({
    where: { userId_businessId: { userId: user.id, businessId } },
  });
  if (!staff) throw new ApiError(403, "Not staff of this business");
  return { user, staff };
}

/** Signed-in user who owns the business. Throws ApiError. */
export async function requireOwner(businessId: string) {
  const res = await requireStaff(businessId);
  if (res.staff.role !== "OWNER") throw new ApiError(403, "Owner only");
  return res;
}

/** Wraps a route body so ApiError/known errors become JSON responses. */
export async function withErrors(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ApiError) return bad(e.message, e.status);
    const msg = e instanceof Error ? e.message : "Internal error";
    if (msg.includes("Unique constraint")) return bad("Already exists", 409);
    console.error(e);
    return bad("Internal error", 500);
  }
}

export async function readJson<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new ApiError(400, "Invalid JSON body");
  }
}
