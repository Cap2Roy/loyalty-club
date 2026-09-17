import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ClubDirectory from "@/components/ClubDirectory";

export default async function ExplorePage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const [businesses, memberships] = await Promise.all([
    prisma.business.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        program: { select: { pointsName: true, currency: true, earnRate: true } },
        _count: { select: { members: true, offers: { where: { active: true } } } },
      },
    }),
    prisma.membership.findMany({ where: { userId: user.id }, select: { business: { select: { slug: true } } } }),
  ]);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 24 }}>Explore clubs</h1>
        <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
          Discover loyalty clubs and start earning on every visit.
        </p>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <a href="/app" className="badge muted">My clubs</a>
        <span className="badge">Explore clubs</span>
        <a href="/app/offers" className="badge muted">Offers feed</a>
        <a href="/app/invites" className="badge muted">My invites</a>
        <a href="/app/map" className="badge muted">Map</a>
        <a href="/app/account" className="badge muted">Account</a>
      </div>
      <ClubDirectory

        businesses={businesses.map((b) => ({
          id: b.id,
          name: b.name,
          slug: b.slug,
          pointsName: b.program?.pointsName ?? "points",
          currency: b.program?.currency ?? "USD",
          earnRate: b.program?.earnRate ?? 10,
          members: b._count.members,
          activeOffers: b._count.offers,
        }))}
        joinedSlugs={memberships.map((m) => m.business.slug)}
      />
    </div>
  );
}
