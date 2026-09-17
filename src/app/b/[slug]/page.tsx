import Link from "next/link";
import { notFound } from "next/navigation";
import { currentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tierConfig } from "@/lib/loyalty";
import JoinClubButton from "@/components/JoinClubButton";

export default async function PublicBusinessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const business = await prisma.business.findUnique({
    where: { slug },
    include: {
      program: true,
      _count: { select: { members: true } },
    },
  });
  if (!business) notFound();

  const [rewards, offers] = await Promise.all([
    prisma.reward.findMany({
      where: { businessId: business.id, active: true },
      orderBy: { cost: "asc" },
      take: 5,
    }),
    prisma.offer.findMany({
      where: { businessId: business.id, active: true },
      orderBy: { startsAt: "desc" },
    }),
  ]);

  const program = business.program;
  const pointsName = program?.pointsName ?? "points";
  const currency = program?.currency ?? "USD";
  const earnRate = program?.earnRate ?? 10;
  const { names: tierNames, thresholds: tierThresholds } = tierConfig(
    program ?? { tierNames: "Member", tierThresholds: "" },
  );

  const userId = await currentUserId();
  const membership = userId
    ? await prisma.membership.findUnique({
        where: { userId_businessId: { userId, businessId: business.id } },
      })
    : null;

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>{business.name}</h1>
        <span className="badge muted">{business._count.members.toLocaleString()} members</span>
        <span className="badge muted">{offers.length} active offer{offers.length === 1 ? "" : "s"}</span>
      </div>

      <div className="card">
        <h2>Program</h2>
        <p style={{ margin: "0 0 8px" }}>
          Earn <strong>{earnRate} {pointsName}</strong> per 1 {currency} spent
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ color: "var(--muted)", fontSize: 13 }}>Tiers:</span>
          {tierNames.map((name, i) => (
            <span key={name} className={i === 0 ? "badge" : "badge good"} title={
              tierThresholds[i - 1] !== undefined
                ? `${currency} ${tierThresholds[i - 1]}+ lifetime spend`
                : undefined
            }>
              {name}
            </span>
          ))}
        </div>
        <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {!userId ? (
            <Link href="/login" className="btn">Sign in to join</Link>
          ) : membership ? (
            <>
              <span className="badge good">You are a member</span>
              <Link href={`/app/club/${business.slug}`} className="btn secondary">Open my club →</Link>
            </>
          ) : (
            <JoinClubButton slug={business.slug} name={business.name} />
          )}
        </div>
      </div>

      <div className="grid cols-2">
        <div className="card">
          <h2>Rewards preview</h2>
          {rewards.length === 0 ? (
            <p className="empty" style={{ margin: 0 }}>No rewards published yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Reward</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                {rewards.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.title}</div>
                      {r.description && (
                        <div style={{ color: "var(--muted)", fontSize: 13 }}>{r.description}</div>
                      )}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>{r.cost} {pointsName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h2>Offers</h2>
          {offers.length === 0 ? (
            <p className="empty" style={{ margin: 0 }}>No active offers right now.</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {offers.map((o) => (
                <div
                  key={o.id}
                  style={{ border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: "12px 14px" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                    <strong>{o.title}</strong>
                    <span className={`badge ${o.kind === "SALE" ? "good" : "warn"}`}>{o.discount || o.kind}</span>
                  </div>
                  {o.description && (
                    <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--muted)" }}>{o.description}</p>
                  )}
                  {o.endsAt && (
                    <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--muted)" }}>
                      Ends {o.endsAt.toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
