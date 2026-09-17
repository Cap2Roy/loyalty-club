import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeTier } from "@/lib/loyalty";
import ProfileForm from "@/components/ProfileForm";
import PhoneVerification from "@/components/PhoneVerification";
import PasswordForm from "@/components/PasswordForm";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const [memberships, staffRoles, coupons, totalCheckins] = await Promise.all([
    prisma.membership.findMany({
      where: { userId: user.id },
      orderBy: { joinedAt: "asc" },
      include: { business: { include: { program: true } } },
    }),
    prisma.businessStaff.findMany({
      where: { userId: user.id },
      include: { business: true },
    }),
    prisma.coupon.count({
      where: { membership: { userId: user.id } },
    }),
    prisma.checkin.count({
      where: { membership: { userId: user.id } },
    }),
  ]);

  const totalPoints = memberships.reduce((sum, m) => sum + m.points, 0);
  const totalSpend = memberships.reduce((sum, m) => sum + m.lifetimeSpend, 0);

  return (
    <div className="fade-in" style={{ display: "grid", gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 24 }}>Account</h1>
        <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
          Manage your profile, password and loyalty activity.
        </p>
      </div>

      <div className="subnav">
        <a href="/app" className="badge muted">My clubs</a>
        <a href="/app/explore" className="badge muted">Explore clubs</a>
        <a href="/app/offers" className="badge muted">Offers feed</a>
        <a href="/app/invites" className="badge muted">My invites</a>
        <a href="/app/map" className="badge muted">Map</a>
        <span className="badge">Account</span>
      </div>

      {/* Stats summary */}
      <div className="grid cols-3">
        <div className="stat card">
          <div className="value">{memberships.length}</div>
          <div className="label">Clubs joined</div>
        </div>
        <div className="stat card">
          <div className="value">{totalPoints.toLocaleString()}</div>
          <div className="label">Total points</div>
        </div>
        <div className="stat card">
          <div className="value">{totalCheckins}</div>
          <div className="label">Total check-ins</div>
        </div>
      </div>

      {/* Profile + Password */}
      <div className="grid cols-2">
        <div className="card">
          <h2>Profile</h2>
          <ProfileForm initialName={user.name} initialPhone={user.phone} email={user.email} />
        </div>
        <div className="card">
          <h2>Change password</h2>
          <PasswordForm />
        </div>
      </div>

      {/* Phone verification */}
      <div className="card">
        <h2>Phone verification</h2>
        <PhoneVerification phone={user.phone} verified={user.phoneVerified} />
      </div>

      {/* Club memberships */}
      <div className="card">
        <h2>Your clubs ({memberships.length})</h2>
        {memberships.length === 0 ? (
          <p className="empty" style={{ margin: 0 }}>You haven&apos;t joined any clubs yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Club</th>
                <th>Tier</th>
                <th>Points</th>
                <th>Lifetime spend</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {memberships.map((m) => {
                const program = m.business.program;
                const tier = computeTier(
                  program ?? { tierNames: "Member", tierThresholds: "" },
                  m.lifetimeSpend,
                );
                return (
                  <tr key={m.id}>
                    <td>
                      <Link href={`/app/club/${m.business.slug}`}>{m.business.name}</Link>
                    </td>
                    <td><span className="badge good">{tier.name}</span></td>
                    <td>{m.points.toLocaleString()} {program?.pointsName ?? "points"}</td>
                    <td>{program?.currency ?? "USD"} {m.lifetimeSpend.toFixed(2)}</td>
                    <td>{m.joinedAt.toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Business staff roles */}
      {staffRoles.length > 0 && (
        <div className="card">
          <h2>Business access ({staffRoles.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Business</th>
                <th>Role</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {staffRoles.map((s) => (
                <tr key={s.id}>
                  <td>{s.business.name}</td>
                  <td>
                    <span className={`badge ${s.role === "OWNER" ? "good" : "muted"}`}>{s.role}</span>
                  </td>
                  <td>
                    <Link href={`/biz/${s.business.id}`} className="btn secondary small">Open console</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lifetime summary */}
      <div className="card">
        <h2>Lifetime activity</h2>
        <div className="grid cols-3">
          <div className="stat" style={{ border: "none", boxShadow: "none", padding: 0 }}>
            <div className="value">{totalSpend.toFixed(2)}</div>
            <div className="label">Total spent across clubs</div>
          </div>
          <div className="stat" style={{ border: "none", boxShadow: "none", padding: 0 }}>
            <div className="value">{coupons}</div>
            <div className="label">Coupons earned</div>
          </div>
          <div className="stat" style={{ border: "none", boxShadow: "none", padding: 0 }}>
            <div className="value">{memberships.length}</div>
            <div className="label">Active memberships</div>
          </div>
        </div>
      </div>
    </div>
  );
}
