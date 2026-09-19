import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StoreMap from "@/components/StoreMap";
import ScrollReveal from "@/components/ScrollReveal";

export const metadata = { title: "Store map" };

export default async function MapPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const businesses = await prisma.business.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      program: { select: { pointsName: true } },
      _count: { select: { members: true, offers: { where: { active: true } } } },
    },
  });

  return (
    <div className="fade-in" style={{ display: "grid", gap: 20 }}>
      <ScrollReveal direction="up">
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>Stores near you</h1>
          <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
            Find loyalty clubs on the map. Tap a pin for details and to join.
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal direction="up" delay={1}>
        <div className="subnav">
          <a href="/app" className="badge muted">My clubs</a>
          <a href="/app/explore" className="badge muted">Explore clubs</a>
          <a href="/app/offers" className="badge muted">Offers feed</a>
          <a href="/app/invites" className="badge muted">My invites</a>
          <a href="/app/account" className="badge muted">Account</a>
          <span className="badge">Store map</span>
        </div>
      </ScrollReveal>

      <ScrollReveal direction="up" delay={2}>
        <StoreMap
          stores={businesses.map((b) => ({
            id: b.id,
            name: b.name,
            slug: b.slug,
            address: b.address,
            latitude: b.latitude ?? 0,
            longitude: b.longitude ?? 0,
            pointsName: b.program?.pointsName ?? "points",
            members: b._count.members,
            activeOffers: b._count.offers,
          }))}
        />
      </ScrollReveal>
    </div>
  );
}
