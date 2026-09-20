import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ScrollReveal from "@/components/ScrollReveal";

export const metadata = { title: "Coupons" };

export default async function BizCouponsPage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) notFound();

  const coupons = await prisma.coupon.findMany({
    where: { businessId },
    orderBy: { issuedAt: "desc" },
    include: {
      membership: { include: { user: { select: { email: true } } } },
      reward: { select: { title: true } },
    },
  });

  const now = new Date();
  const active = coupons.filter((c) => c.status === "ACTIVE" && (!c.expiresAt || c.expiresAt >= now)).length;
  const redeemed = coupons.filter((c) => c.status === "REDEEMED").length;
  const expired = coupons.filter((c) => c.status === "EXPIRED" || (c.status === "ACTIVE" && c.expiresAt && c.expiresAt < now)).length;

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <ScrollReveal direction="up">
        <div className="grid cols-3">
          <div className="stat card">
            <div className="value">{coupons.length}</div>
            <div className="label">Total coupons</div>
          </div>
          <div className="stat card">
            <div className="value">{active}</div>
            <div className="label">Active</div>
          </div>
          <div className="stat card">
            <div className="value">{redeemed}</div>
            <div className="label">Redeemed</div>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal direction="up" delay={1}>
        <div className="card">
          <h2>All coupons ({coupons.length})</h2>
          {coupons.length === 0 ? (
            <p className="empty">No coupons issued yet. Members earn coupons by redeeming rewards.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Reward</th>
                  <th>Member</th>
                  <th>Code</th>
                  <th>Status</th>
                  <th>Issued</th>
                  <th>Expires</th>
                  <th>Redeemed</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => {
                  const isExpired = c.status === "EXPIRED" || (c.status === "ACTIVE" && c.expiresAt && c.expiresAt < now);
                  const status = isExpired ? "EXPIRED" : c.status;
                  return (
                  <tr key={c.id} className="stagger-item">
                    <td>{c.reward?.title ?? "Reward"}</td>
                    <td>{c.membership.user.email}</td>
                    <td><code className="mono">{c.code}</code></td>
                    <td>
                      <span className={`badge ${status === "ACTIVE" ? "good" : status === "REDEEMED" ? "muted" : "bad"}`}>
                        {status}
                      </span>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>{c.issuedAt.toLocaleDateString()}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{c.expiresAt ? c.expiresAt.toLocaleDateString() : "Never"}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{c.redeemedAt ? c.redeemedAt.toLocaleDateString() : "—"}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </ScrollReveal>
    </div>
  );
}
