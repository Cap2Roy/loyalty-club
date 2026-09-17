import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeTier } from "@/lib/loyalty";

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
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <a href={`/app/club/${slug}`} className="btn secondary small">← Club</a>
        <h1 style={{ margin: 0, fontSize: 24 }}>Digital card</h1>
      </div>

      <div className="subnav">
        <a href="/app" className="badge muted">My clubs</a>
        <a href="/app/explore" className="badge muted">Explore clubs</a>
        <a href="/app/offers" className="badge muted">Offers feed</a>
        <a href="/app/invites" className="badge muted">My invites</a>
        <a href="/app/map" className="badge muted">Map</a>
        <a href="/app/account" className="badge muted">Account</a>
      </div>

      {/* Passbook-style digital loyalty card — 3D floating */}
      <div style={{ perspective: "1200px" }}>
      <div
        style={{
          maxWidth: 380,
          margin: "0 auto",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          background: "var(--gradient-brand)",
          color: "#fff",
          boxShadow: "var(--shadow-2xl), var(--inset-edge-strong)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          transform: "rotateX(2deg)",
          position: "relative",
        }}
      >
        {/* Shine overlay */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "40%", background: "linear-gradient(180deg, rgba(255,255,255,0.12), transparent)", pointerEvents: "none", zIndex: 1 }} />
        {/* Content (above shine overlay) */}
        <div style={{ position: "relative", zIndex: 2 }}>
        {/* Header: business name */}
        <div style={{ padding: "24px 28px 8px", textAlign: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.75 }}>
            Loyalty card
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4, letterSpacing: "-0.02em" }}>
            {business.name}
          </div>
        </div>

        {/* Points balance */}
        <div style={{ padding: "16px 28px 4px", textAlign: "center" }}>
          <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.03em" }}>
            {membership.points.toLocaleString()}
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 6 }}>
            {pointsName}
          </div>
        </div>

        {/* Tier badge */}
        <div style={{ padding: "12px 28px", textAlign: "center" }}>
          <span
            style={{
              display: "inline-block",
              padding: "5px 16px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.22)",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.04em",
            }}
          >
            {tier.name}
          </span>
        </div>

        {/* QR code */}
        <div
          style={{
            margin: "16px 28px",
            padding: 16,
            background: "#fff",
            borderRadius: "var(--radius)",
            textAlign: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrDataUrl}
            alt={`QR code to join ${business.name}`}
            width={200}
            height={200}
            style={{ display: "block", margin: "0 auto", borderRadius: 8, imageRendering: "pixelated" }}
          />
          <div style={{ marginTop: 12, fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", color: "var(--ink-soft)", textTransform: "uppercase" }}>
            Referral code
          </div>
          <code
            className="mono"
            style={{ display: "inline-block", marginTop: 4, fontSize: 15, fontWeight: 600 }}
          >
            {membership.referralCode}
          </code>
        </div>

        {/* Footer: lifetime stats */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            padding: "18px 28px 24px",
            borderTop: "1px solid rgba(255,255,255,0.18)",
            fontSize: 13,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>
              {currency} {membership.lifetimeSpend.toFixed(2)}
            </div>
            <div style={{ opacity: 0.7, fontSize: 12, marginTop: 2 }}>Lifetime spend</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>
              {membership.lifetimeEarned.toLocaleString()}
            </div>
            <div style={{ opacity: 0.7, fontSize: 12, marginTop: 2 }}>{pointsName} earned</div>
          </div>
        </div>
        </div>
      </div>
      </div>
    </div>
  );
}
