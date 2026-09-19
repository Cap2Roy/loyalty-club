import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ScrollReveal from "@/components/ScrollReveal";

export default async function OffersFeedPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    select: { businessId: true },
  });
  const businessIds = memberships.map((m) => m.businessId);

  const offers =
    businessIds.length > 0
      ? await prisma.offer.findMany({
          where: { businessId: { in: businessIds }, active: true },
          orderBy: { startsAt: "desc" },
          include: { business: { select: { name: true, slug: true } } },
        })
      : [];
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <ScrollReveal direction="up">
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>Offers feed</h1>
          <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
            Active offers from every club you&apos;re a member of.
          </p>
        </div>
      </ScrollReveal>
      <ScrollReveal direction="up" delay={1}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a href="/app" className="badge muted">My clubs</a>
          <a href="/app/explore" className="badge muted">Explore clubs</a>
          <span className="badge">Offers feed</span>
          <a href="/app/invites" className="badge muted">My invites</a>
          <a href="/app/map" className="badge muted">Map</a>
          <a href="/app/account" className="badge muted">Account</a>
        </div>
      </ScrollReveal>

      <ScrollReveal direction="up" delay={2}>
        {offers.length === 0 ? (
          <div className="card">
            <p className="empty" style={{ margin: 0 }}>No offers right now — join more clubs</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {offers.map((o) => (
              <div key={o.id} className="card hoverable stagger-item" style={{ padding: "16px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                  <div>
                    <Link href={`/b/${o.business.slug}`} style={{ color: "var(--muted)", fontSize: 13 }}>
                      {o.business.name}
                    </Link>
                    <div style={{ fontWeight: 700, fontSize: 17 }}>{o.title}</div>
                  </div>
                  <span className={`badge ${o.kind === "SALE" ? "good" : "warn"}`}>{o.discount || o.kind}</span>
                </div>
                {o.description && (
                  <p style={{ margin: "6px 0 0", color: "var(--muted)", fontSize: 14 }}>{o.description}</p>
                )}
                {(o.startsAt || o.endsAt) && (
                  <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--muted)" }}>
                    {o.startsAt && <>Starts {o.startsAt.toLocaleDateString()}</>}
                    {o.startsAt && o.endsAt && " · "}
                    {o.endsAt && <>Ends {o.endsAt.toLocaleDateString()}</>}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollReveal>
    </div>
  );
}
