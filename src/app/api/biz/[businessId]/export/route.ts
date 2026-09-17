import { prisma } from "@/lib/prisma";
import { requireStaff, withErrors } from "@/lib/api";

function csvField(value: string | number | null | undefined): string {
  let s = value == null ? "" : String(value);
  // Neutralize CSV formula injection: prefix cells starting with =, +, -, @, or tab.
  if (/^[=+\t@]/.test(s)) s = `'` + s;
  // Wrap in quotes if the value contains a comma, quote, or newline; double any quotes.
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function csvRow(...fields: (string | number | null | undefined)[]): string {
  return fields.map(csvField).join(",");
}

export async function GET(req: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  return withErrors(async () => {
    await requireStaff(businessId);

    const url = new URL(req.url);
    const format = url.searchParams.get("format") === "json" ? "json" : "csv";
    const fromParam = url.searchParams.get("from");
    const toParam = url.searchParams.get("to");

    const dateRange: { gte?: Date; lte?: Date } = {};
    if (fromParam) {
      const from = new Date(fromParam);
      if (!isNaN(from.getTime())) dateRange.gte = from;
    }
    if (toParam) {
      const to = new Date(toParam);
      if (!isNaN(to.getTime())) dateRange.lte = to;
    }

    const checkinWhere: { businessId: string; at?: { gte?: Date; lte?: Date } } = { businessId };
    if (dateRange.gte || dateRange.lte) checkinWhere.at = { ...dateRange };

    const [checkins, ledgerEntries, memberships] = await Promise.all([
      prisma.checkin.findMany({
        where: checkinWhere,
        orderBy: { at: "asc" },
        include: { membership: { include: { user: true } } },
      }),
      prisma.ledgerEntry.findMany({
        where: { membership: { businessId } },
        orderBy: { createdAt: "asc" },
        include: { membership: { include: { user: true } } },
      }),
      prisma.membership.findMany({
        where: { businessId },
        include: { user: true },
      }),
    ]);

    const totalSpend = checkins.reduce((sum, c) => sum + c.spend, 0);
    const totalPointsIssued = ledgerEntries
      .filter((e) => e.reason === "EARN")
      .reduce((sum, e) => sum + e.delta, 0);
    const totalPointsOutstanding = memberships.reduce((sum, m) => sum + m.points, 0);

    if (format === "json") {
      const body = {
        checkins: checkins.map((c) => ({
          id: c.id,
          date: c.at.toISOString(),
          member_email: c.membership.user.email,
          spend: c.spend,
          points: c.points,
          staff_id: c.staffId,
        })),
        ledger: ledgerEntries.map((e) => ({
          id: e.id,
          date: e.createdAt.toISOString(),
          member_email: e.membership.user.email,
          delta: e.delta,
          reason: e.reason,
          note: e.note,
        })),
        members: memberships.map((m) => ({
          id: m.id,
          member_email: m.user.email,
          points: m.points,
          lifetimeSpend: m.lifetimeSpend,
          lifetimeEarned: m.lifetimeEarned,
        })),
        summary: {
          totalSpend,
          totalPointsIssued,
          totalPointsOutstanding,
          memberCount: memberships.length,
        },
      };

      return new Response(JSON.stringify(body, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": 'attachment; filename="export.json"',
        },
      });
    }

    // CSV: two sections — CHECKINS then LEDGER.
    const lines: string[] = [];
    lines.push("CHECKINS");
    lines.push(csvRow("date", "member_email", "spend", "points", "staff_id"));
    for (const c of checkins) {
      lines.push(
        csvRow(c.at.toISOString(), c.membership.user.email, c.spend, c.points, c.staffId),
      );
    }
    lines.push("");
    lines.push("LEDGER");
    lines.push(csvRow("date", "member_email", "delta", "reason", "note"));
    for (const e of ledgerEntries) {
      lines.push(
        csvRow(e.createdAt.toISOString(), e.membership.user.email, e.delta, e.reason, e.note),
      );
    }
    lines.push("");

    return new Response(lines.join("\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="export.csv"',
      },
    });
  });
}
