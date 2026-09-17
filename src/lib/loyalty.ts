import { prisma } from "./prisma";
import { ApiError } from "./api";

export type TierInfo = { index: number; name: string; nextThreshold: number | null };

/** Parses Program.tierNames/tierThresholds CSV config into parallel arrays. */
export function tierConfig(program: { tierNames: string; tierThresholds: string }): { names: string[]; thresholds: number[] } {
  const names = program.tierNames.split(",").map((s) => s.trim()).filter(Boolean);
  const thresholds = program.tierThresholds.split(",").map((s) => parseFloat(s.trim())).filter((n) => !Number.isNaN(n));
  return { names, thresholds: thresholds.slice(0, names.length - 1) };
}

export function computeTier(program: { tierNames: string; tierThresholds: string }, lifetimeSpend: number): TierInfo {
  const { names, thresholds } = tierConfig(program);
  if (names.length === 0) return { index: 0, name: "Member", nextThreshold: null };
  let index = 0;
  for (let i = 0; i < thresholds.length; i++) {
    if (lifetimeSpend >= thresholds[i]) index = i + 1;
  }
  const nextThreshold = index < names.length - 1 && thresholds[index] !== undefined ? thresholds[index] : null;
  return { index, name: names[index] ?? names[0], nextThreshold };
}

export function earnFor(spend: number, earnRate: number): number {
  return Math.max(0, Math.floor(spend * earnRate));
}

/** Records a purchase/check-in: award points atomically with ledger + checkin rows. */
export async function recordCheckin(membershipId: string, spend: number, staffId: string | null, note = "") {
  const membership = await prisma.membership.findUnique({ where: { id: membershipId }, include: { business: { include: { program: true } } } });
  if (!membership) throw new ApiError(404, "Membership not found");
  const rate = membership.business.program?.earnRate ?? 10;
  const delta = earnFor(spend, rate);
  return prisma.$transaction(async (tx) => {
    const updated = await tx.membership.update({
      where: { id: membershipId },
      data: { points: { increment: delta }, lifetimeEarned: { increment: delta }, lifetimeSpend: { increment: spend } },
    });
    await tx.checkin.create({ data: { membershipId, businessId: membership.businessId, staffId, points: delta, spend } });
    await tx.ledgerEntry.create({ data: { membershipId, delta, reason: "EARN", note: note || `Purchase ${membership.business.program?.currency ?? "USD"} ${spend.toFixed(2)}`, staffId: staffId ?? null } });
    return { delta, membership: updated };
  });
}

/** Manual points adjustment (owner/staff correction). Negative delta allowed. */
export async function adjustPoints(membershipId: string, delta: number, note: string, staffId?: string) {
  const membership = await prisma.membership.findUnique({ where: { id: membershipId } });
  if (!membership) throw new ApiError(404, "Membership not found");
  return prisma.$transaction(async (tx) => {
    const updated = await tx.membership.update({
      where: { id: membershipId },
      data: { points: { increment: delta }, ...(delta > 0 ? { lifetimeEarned: { increment: delta } } : {}) },
    });
    await tx.ledgerEntry.create({ data: { membershipId, delta, reason: "ADJUST", note, staffId: staffId ?? null } });
    return updated;
  });
}

/** Redeems points for a reward coupon. Throws on insufficient balance/inactive reward. */
export async function redeemReward(membershipId: string, rewardId: string) {
  return prisma.$transaction(async (tx) => {
    const membership = await tx.membership.findUnique({ where: { id: membershipId }, include: { business: { include: { program: true } } } });
    if (!membership) throw new ApiError(404, "Membership not found");
    const reward = await tx.reward.findUnique({ where: { id: rewardId } });
    if (!reward || reward.businessId !== membership.businessId) throw new ApiError(404, "Reward not found");
    if (!reward.active) throw new ApiError(400, "Reward is not available");
    const min = membership.business.program?.minRedeem ?? 0;
    if (membership.points < reward.cost || membership.points < min) throw new ApiError(400, `Not enough ${membership.business.program?.pointsName ?? "points"}`);
    const updated = await tx.membership.update({ where: { id: membershipId }, data: { points: { decrement: reward.cost } } });
    await tx.ledgerEntry.create({ data: { membershipId, delta: -reward.cost, reason: "REDEEM", note: `Reward: ${reward.title}` } });
    const expiresAt = reward.expiresInDays != null ? new Date(Date.now() + reward.expiresInDays * 86400000) : null;
    const coupon = await tx.coupon.create({ data: { membershipId, rewardId, businessId: membership.businessId, expiresAt } });
    return { coupon, membership: updated };
  });
}

/** Staff marks an ACTIVE coupon as used at the counter. */
export async function redeemCoupon(couponId: string, businessId: string) {
  const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
  if (!coupon || coupon.businessId !== businessId) throw new ApiError(404, "Coupon not found");
  if (coupon.status !== "ACTIVE") throw new ApiError(400, `Coupon is ${coupon.status.toLowerCase()}`);
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    await prisma.coupon.update({ where: { id: couponId }, data: { status: "EXPIRED" } });
    throw new ApiError(400, "Coupon expired");
  }
  return prisma.coupon.update({ where: { id: couponId }, data: { status: "REDEEMED", redeemedAt: new Date() } });
}

/** Member-facing slug of a business id for URLs. */
export function programDefaults() {
  return { pointsName: "points", earnRate: 10, minRedeem: 100, currency: "USD", tierNames: "Member", tierThresholds: "" };
}
