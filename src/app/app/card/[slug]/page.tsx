import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeTier } from "@/lib/loyalty";
import FlipCard from "@/components/FlipCard";
import ScrollReveal from "@/components/ScrollReveal";

export const metadata = { title: "Digital card" };

export default async function CardPage({
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

  const origin =
    (await headers()).get("origin") ??
    `http://localhost:${process.env.PORT ?? 3000}`;
  const qrDataUrl = await QRCode.toDataURL(
    `${origin}/app/join?ref=${membership.referralCode}`,
    { margin: 1, width: 240 },
  );

  return (
    <div className="fade-in" style={{ display: "grid", gap: 20 }}>
      <ScrollReveal direction="up">
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <a href={`/app/club/${slug}`} className="btn secondary small">← Club</a>
          <h1 style={{ margin: 0, fontSize: 24 }}>Digital card</h1>
        </div>
      </ScrollReveal>

      <ScrollReveal direction="up" delay={1}>
        <div className="subnav">
          <a href="/app" className="badge muted">My clubs</a>
          <a href="/app/explore" className="badge muted">Explore clubs</a>
          <a href="/app/offers" className="badge muted">Offers feed</a>
          <a href="/app/invites" className="badge muted">My invites</a>
          <a href="/app/map" className="badge muted">Map</a>
          <a href="/app/account" className="badge muted">Account</a>
        </div>
      </ScrollReveal>

      {/* Flip card — tap to reveal QR code on back */}
      <ScrollReveal direction="scale" delay={2} style={{ display: "flex", justifyContent: "center" }}>
        <FlipCard
          businessName={business.name}
          points={membership.points}
          pointsName={pointsName}
          tier={tier.name}
          currency={currency}
          lifetimeSpend={membership.lifetimeSpend}
          lifetimeEarned={membership.lifetimeEarned}
          qrDataUrl={qrDataUrl}
          referralCode={membership.referralCode}
        />
      </ScrollReveal>
    </div>
  );
}
