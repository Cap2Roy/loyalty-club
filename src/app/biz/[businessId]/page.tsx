import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { liveOfferClause } from "@/lib/loyalty";
import ExportPanel from "@/components/ExportPanel";
import ScrollReveal from "@/components/ScrollReveal";
import AnimatedCounter from "@/components/AnimatedCounter";

export const metadata = { title: "Business dashboard" };

export default async function BizDashboardPage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { program: true },
  });
  if (!business) notFound();

  const [members, checkins, pointsIssued, pointsOutstanding, activeRewards, activeOffers, recentCheckins, topMembers, totalRevenue, couponsTotal, couponsRedeemed] =
    await Promise.all([
      prisma.membership.count({ where: { businessId } }),
      prisma.checkin.count({ where: { businessId } }),
      prisma.ledgerEntry.aggregate({ _sum: { delta: true }, where: { reason: "EARN", membership: { businessId } } }),
      prisma.membership.aggregate({ _sum: { points: true }, where: { businessId } }),
      prisma.reward.count({ where: { businessId, active: true } }),
      prisma.offer.count({ where: { businessId, ...liveOfferClause() } }),
      prisma.checkin.findMany({
        where: { businessId },
        orderBy: { at: "desc" },
        take: 10,
        include: { membership: { include: { user: true } } },
      }),
      prisma.membership.findMany({
        where: { businessId },
        orderBy: { points: "desc" },
        take: 5,
        include: { user: true },
      }),
      prisma.checkin.aggregate({ _sum: { spend: true }, where: { businessId } }),
      prisma.coupon.count({ where: { businessId } }),
      prisma.coupon.count({ where: { businessId, status: "REDEEMED" } }),
    ]);

  const program = business.program;
  return (
    <>
      <ScrollReveal direction="up">
      <div className="grid cols-3">
        <div className="stat card">
          <div className="value"><AnimatedCounter value={members} /></div>
          <div className="label">Members</div>
        </div>
        <div className="stat card">
          <div className="value"><AnimatedCounter value={checkins} /></div>
          <div className="label">Check-ins</div>
        </div>
        <div className="stat card">
          <div className="value"><AnimatedCounter value={pointsIssued._sum.delta ?? 0} /></div>
          <div className="label">{program?.pointsName ?? "points"} issued</div>
        </div>
        <div className="stat card">
          <div className="value"><AnimatedCounter value={pointsOutstanding._sum.points ?? 0} /></div>
          <div className="label">{program?.pointsName ?? "points"} outstanding</div>
        </div>
        <div className="stat card">
          <div className="value"><AnimatedCounter value={activeRewards} /></div>
          <div className="label">Active rewards</div>
        </div>
        <div className="stat card">
          <div className="value"><AnimatedCounter value={activeOffers} /></div>
          <div className="label">Active offers</div>
        </div>
      </div>
      </ScrollReveal>

      <ScrollReveal direction="up" delay={1}>
      <div className="grid cols-3">
        <div className="stat card">
          <div className="value">{program?.currency ?? "USD"} <AnimatedCounter value={Math.round(totalRevenue._sum.spend ?? 0)} /></div>
          <div className="label">Total revenue</div>
        </div>
        <div className="stat card">
          <div className="value">{program?.currency ?? "USD"} <AnimatedCounter value={checkins > 0 ? Math.round((totalRevenue._sum.spend ?? 0) / checkins * 100) / 100 : 0} /></div>
          <div className="label">Avg spend / visit</div>
        </div>
        <div className="stat card">
          <div className="value"><AnimatedCounter value={couponsTotal > 0 ? Math.round(couponsRedeemed / couponsTotal * 100) : 0} />%</div>
          <div className="label">Coupon redemption rate</div>
        </div>
      </div>
      </ScrollReveal>
      <ScrollReveal direction="up" delay={2}>
      <div className="grid cols-2">
        <div className="card">
          <h2>Recent check-ins</h2>
          {recentCheckins.length === 0 ? (
            <p className="empty">No check-ins yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Spend</th>
                  <th>Points</th>
                  <th>At</th>
                </tr>
              </thead>
              <tbody>
                {recentCheckins.map((c) => (
                  <tr key={c.id}>
                    <td>{c.membership.user.email}</td>
                    <td>{program?.currency ?? "USD"} {c.spend.toFixed(2)}</td>
                    <td>+{c.points}</td>
                    <td>{c.at.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h2>Top members</h2>
          {topMembers.length === 0 ? (
            <p className="empty">No members yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>{program?.pointsName ?? "Points"}</th>
                  <th>Lifetime spend</th>
                </tr>
              </thead>
              <tbody>
                {topMembers.map((m) => (
                  <tr key={m.id}>
                    <td>{m.user.email}</td>
                    <td>{m.points}</td>
                    <td>{program?.currency ?? "USD"} {m.lifetimeSpend.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      </ScrollReveal>

      <ScrollReveal direction="up" delay={2}>
      <div className="card">
        <h2>Accounting export</h2>
        <ExportPanel businessId={businessId} />
      </div>
      </ScrollReveal>
     </>
  );
}
