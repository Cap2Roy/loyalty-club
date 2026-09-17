import { prisma } from "@/lib/prisma";
import { ok, bad, requireStaff, withErrors, readJson } from "@/lib/api";
import { recordCheckin } from "@/lib/loyalty";

type BatchEntry = { code?: string; spend?: number };
type BatchBody = { entries?: BatchEntry[] };

export async function POST(req: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  return withErrors(async () => {
    const { user } = await requireStaff(businessId);
    const body = await readJson<BatchBody>(req);
    const entries = body.entries;
    if (!Array.isArray(entries) || entries.length === 0) {
      return bad("entries array is required", 400);
    }
    if (entries.length > 100) {
      return bad("Maximum 100 entries per batch", 400);
    }

    const results: Array<{
      code: string;
      ok: boolean;
      error?: string;
      delta?: number;
      points?: number;
      member?: string;
    }> = [];

    for (const entry of entries) {
      const code = (entry.code ?? "").trim();
      const spend = Number(entry.spend);
      if (!code) {
        results.push({ code: code || "(empty)", ok: false, error: "Missing code" });
        continue;
      }
      if (!Number.isFinite(spend) || spend < 0) {
        results.push({ code, ok: false, error: "Invalid spend" });
        continue;
      }
      const membership = await prisma.membership.findUnique({
        where: { referralCode: code },
        include: { user: true },
      });
      if (!membership || membership.businessId !== businessId) {
        results.push({ code, ok: false, error: "Member not found" });
        continue;
      }
      try {
        const result = await recordCheckin(membership.id, spend, user.id);
        results.push({
          code,
          ok: true,
          delta: result.delta,
          points: result.membership.points,
          member: membership.user.email,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Check-in failed";
        results.push({ code, ok: false, error: msg });
      }
    }

    const successCount = results.filter((r) => r.ok).length;
    return ok({ results, successCount, total: entries.length });
  });
}
