import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeTier, programDefaults } from "@/lib/loyalty";
import RedeemButton from "@/components/RedeemButton";
import ReferralShare from "@/components/ReferralShare";

export default async function ClubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");

  const { slug } = await params;
  const membership = await prisma.membership.findFirst({
    where: { userId: user.id, business: { slug } },
    include: { business: { include: { program: true } } },
  });
  if (!membership) notFound();

  const business = membership.business;
  const program = business.program;
  const pointsName = program?.pointsName ?? "points";
  const currency = program?.currency ?? "USD";
  const tier = computeTier(
    program ?? { tierNames: "Member", tierThresholds: "" },
    membership.lifetimeSpend,
  );

  const [rewards, offers, coupons, ledger, userMemberships, allBusinesses, referrals] = await Promise.all([
    prisma.reward.findMany({
      where: { businessId: business.id, active: true },
      orderBy: { cost: "asc" },
    }),
    prisma.offer.findMany({
      where: { businessId: business.id, active: true },
      orderBy: { startsAt: "asc" },
    }),
    prisma.coupon.findMany({
      where: { membershipId: membership.id },
      orderBy: { issuedAt: "desc" },
      include: { reward: { select: { title: true } } },
    }),
    prisma.ledgerEntry.findMany({
      where: { membershipId: membership.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.membership.findMany({
      where: { userId: user.id },
      include: { business: { select: { id: true, name: true, slug: true } } },
    }),
    prisma.business.findMany({ select: { id: true, name: true, slug: true } }),
    prisma.crossStoreReferral.findMany({
      where: { referrerId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        sourceBusiness: { select: { name: true, slug: true } },
        targetBusiness: { select: { name: true, slug: true } },
      },
    }),
  ]);

  const origin = (await headers()).get("origin") ?? `http://localhost:${process.env.PORT ?? 3000}`;
  const qrDataUrl = await QRCode.toDataURL(`${origin}/app/join?ref=${membership.referralCode}`, {
    width: 160,
    margin: 1,
  });

  const progress =
    tier.nextThreshold !== null && tier.nextThreshold > 0
      ? Math.min(1, membership.lifetimeSpend / tier.nextThreshold)
      : null;

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <a href="/app" className="btn secondary small">← My clubs</a>
        <h1 style={{ margin: 0, fontSize: 24 }}>{business.name}</h1>
        <span className="badge good">{tier.name}</span>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <a href="/app" className="badge muted">My clubs</a>
        <a href="/app/explore" className="badge muted">Explore clubs</a>
        <a href="/app/offers" className="badge muted">Offers feed</a>
        <a href="/app/invites" className="badge muted">My invites</a>
        <a href="/app/map" className="badge muted">Map</a>
        <a href={`/app/card/${slug}`} className="badge muted">Card</a>
        <a href="/app/account" className="badge muted">Account</a>
      </div>

      <div className="points-hero">
        <div className="label">{pointsName.toUpperCase()}</div>
        <div className="value">{membership.points.toLocaleString()}</div>
        <div className="label" style={{ marginTop: 8 }}>
          {currency} {membership.lifetimeSpend.toFixed(2)} lifetime spend ·{" "}
          {membership.lifetimeEarned.toLocaleString()} {pointsName} earned
        </div>
      </div>

      <div className="card">
        <h2>Tier progress</h2>
        {tier.nextThreshold !== null ? (
          <>
            <p style={{ margin: "0 0 4px", color: "var(--muted)", fontSize: 14 }}>
              Spend {currency} {(tier.nextThreshold - membership.lifetimeSpend).toFixed(2)} more to reach the next tier.
            </p>
            <div className="progress" aria-label={`Progress to next tier: ${Math.round((progress ?? 0) * 100)}%`}>
              <div style={{ width: `${Math.round((progress ?? 0) * 100)}%` }} />
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--muted)" }}>
              {currency} {membership.lifetimeSpend.toFixed(2)} / {currency} {tier.nextThreshold.toFixed(2)}
            </p>
          </>
        ) : (
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14 }}>
            You&apos;ve reached the top tier. Thanks for being a loyal member!
          </p>
        )}
      </div>

      <div className="grid cols-2">
        <div className="card">
          <h2>Rewards</h2>
          {rewards.length === 0 ? (
            <p className="empty" style={{ margin: 0 }}>No rewards available yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Reward</th>
                  <th>Cost</th>
                  <th></th>
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
                    <td style={{ whiteSpace: "nowrap" }}>
                      {r.cost} {pointsName}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <RedeemButton
                        membershipId={membership.id}
                        rewardId={r.id}
                        cost={r.cost}
                        points={membership.points}
                        pointsName={pointsName}
                      />
                    </td>
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
                    <p style={{ margin: "6px 0 0", color: "var(--muted)", fontSize: 14 }}>{o.description}</p>
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

      <div className="card">
        <h2>Your coupons</h2>
        {coupons.length === 0 ? (
          <p className="empty" style={{ margin: 0 }}>No coupons yet. Redeem a reward above to get one.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Reward</th>
                <th>Code</th>
                <th>Status</th>
                <th>Expires</th>
                <th>Issued</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => {
                const expired = c.status === "ACTIVE" && c.expiresAt && c.expiresAt < new Date();
                return (
                <tr key={c.id}>
                  <td>{c.reward?.title ?? "Reward"}</td>
                  <td><code className="mono">{c.code}</code></td>
                  <td>
                    <span className={`badge ${expired ? "bad" : c.status === "ACTIVE" ? "good" : c.status === "REDEEMED" ? "muted" : "bad"}`}>
                      {expired ? "EXPIRED" : c.status}
                    </span>
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>{c.expiresAt ? c.expiresAt.toLocaleDateString() : "Never"}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{c.issuedAt.toLocaleDateString()}</td>
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="grid cols-2">
        <div className="card">
          <h2>Invite a friend</h2>
          <div className="qr-box">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt={`QR code to join ${business.name}`} width={160} height={160} />
            <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
              Scan to join with your referral code
            </p>
            <code className="mono">{membership.referralCode}</code>
          </div>
        </div>

        <div className="card">
          <h2>Recent activity</h2>
          {ledger.length === 0 ? (
            <p className="empty" style={{ margin: 0 }}>No activity yet. Visit the store to earn {pointsName}.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Change</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((e) => (
                  <tr key={e.id}>
                    <td style={{ whiteSpace: "nowrap" }}>{e.createdAt.toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${e.delta > 0 ? "good" : "bad"}`}>
                        {e.delta > 0 ? `+${e.delta}` : e.delta}
                      </span>
                    </td>
                    <td style={{ color: "var(--muted)", fontSize: 13 }}>{e.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <div className="card">
        <h2>Refer to another club</h2>
        <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 0 }}>
          Share a cross-store referral code. Earn bonus points when a friend joins another club in the network.
        </p>
        <ReferralShare
          userMemberships={userMemberships.map((m) => ({ id: m.id, business: m.business }))}
          allBusinesses={allBusinesses}
          existingReferrals={referrals.map((r) => ({
            id: r.id,
            code: r.code,
            status: r.status,
            bonusPoints: r.bonusPoints,
            refereeBonus: r.refereeBonus,
            createdAt: r.createdAt.toISOString(),
            expiresAt: r.expiresAt ? r.expiresAt.toISOString() : null,
            claimedAt: r.claimedAt ? r.claimedAt.toISOString() : null,
            sourceBusiness: r.sourceBusiness,
            targetBusiness: r.targetBusiness,
          }))}
        />
      </div>
    </div>
  );
}
