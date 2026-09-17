import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ExportPanel from "@/components/ExportPanel";

export const metadata = { title: "Business dashboard" };

export default async function BizDashboardPage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { program: true },
  });
  if (!business) notFound();

  const [members, checkins, pointsIssued, pointsOutstanding, activeRewards, activeOffers, recentCheckins, topMembers] =
    await Promise.all([
      prisma.membership.count({ where: { businessId } }),
      prisma.checkin.count({ where: { businessId } }),
      prisma.ledgerEntry.aggregate({ _sum: { delta: true }, where: { reason: "EARN", membership: { businessId } } }),
      prisma.membership.aggregate({ _sum: { points: true }, where: { businessId } }),
      prisma.reward.count({ where: { businessId, active: true } }),
      prisma.offer.count({ where: { businessId, active: true } }),
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
    ]);

  const program = business.program;

  return (
    <>
      <div className="grid cols-3">
        <div className="stat card">
          <div className="value">{members}</div>
          <div className="label">Members</div>
        </div>
        <div className="stat card">
          <div className="value">{checkins}</div>
          <div className="label">Check-ins</div>
        </div>
        <div className="stat card">
          <div className="value">{pointsIssued._sum.delta ?? 0}</div>
          <div className="label">{program?.pointsName ?? "points"} issued</div>
        </div>
        <div className="stat card">
          <div className="value">{pointsOutstanding._sum.points ?? 0}</div>
          <div className="label">{program?.pointsName ?? "points"} outstanding</div>
        </div>
        <div className="stat card">
          <div className="value">{activeRewards}</div>
          <div className="label">Active rewards</div>
        </div>
        <div className="stat card">
          <div className="value">{activeOffers}</div>
          <div className="label">Active offers</div>
        </div>
      </div>

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

      <div className="card">
        <h2>Accounting export</h2>
        <ExportPanel businessId={businessId} />
      </div>
     </>
  );
}
