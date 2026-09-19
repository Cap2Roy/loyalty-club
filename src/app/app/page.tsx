import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeTier, programDefaults } from "@/lib/loyalty";
import ScrollReveal from "@/components/ScrollReveal";
import AnimatedCounter from "@/components/AnimatedCounter";

export default async function AppHomePage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    orderBy: { joinedAt: "asc" },
    include: { business: { include: { program: true } } },
  });

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <ScrollReveal direction="up">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24 }}>My clubs</h1>
            <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
              Signed in as <span className="badge muted">{user.email}</span>
            </p>
          </div>
          <Link href="/app/join" className="btn">Join a club</Link>
        </div>
      </ScrollReveal>

      <ScrollReveal direction="up" delay={1}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span className="badge">My clubs</span>
          <a href="/app/explore" className="badge muted">Explore clubs</a>
          <a href="/app/offers" className="badge muted">Offers feed</a>
          <a href="/app/invites" className="badge muted">My invites</a>
          <a href="/app/map" className="badge muted">Map</a>
          <a href="/app/account" className="badge muted">Account</a>
        </div>
      </ScrollReveal>

      {memberships.length === 0 ? (
        <div className="card">
          <div className="empty">
            <p style={{ fontWeight: 600, margin: "0 0 4px" }}>You haven&apos;t joined any clubs yet.</p>
            <p style={{ margin: "0 0 16px" }}>Join a business to start earning points on every visit.</p>
            <Link href="/app/join" className="btn">Find a club to join</Link>
          </div>
        </div>
      ) : (
        <div className="grid cols-2">
          {memberships.map((m, i) => {
            const program = m.business.program;
            const tier = computeTier(
              program ?? { tierNames: "Member", tierThresholds: "" },
              m.lifetimeSpend,
            );
            const pointsName = program?.pointsName ?? "points";
            return (
              <ScrollReveal key={m.id} delay={(i + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8} direction="scale">
                <Link
                  href={`/app/club/${m.business.slug}`}
                  style={{ display: "block" }}
                >
                  <div className="card" style={{ height: "100%" }}>
                    <h2 style={{ fontSize: 18 }}>{m.business.name}</h2>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontSize: 32, fontWeight: 800 }}>
                        <AnimatedCounter value={m.points} />
                      </span>
                      <span style={{ color: "var(--muted)", fontSize: 14 }}>{pointsName}</span>
                    </div>
                    <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span className="badge good">{tier.name}</span>
                      <span className="badge muted">
                        {program?.currency ?? "USD"} {m.lifetimeSpend.toFixed(2)} lifetime
                      </span>
                    </div>
                    <p style={{ color: "var(--muted)", fontSize: 13, margin: "12px 0 0" }}>
                      View club →
                    </p>
                  </div>
                </Link>
              </ScrollReveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
