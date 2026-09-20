import Link from "next/link";
import type { CSSProperties } from "react";
import { prisma } from "@/lib/prisma";
import { liveOfferClause } from "@/lib/loyalty";
import ScrollReveal from "@/components/ScrollReveal";

// Directory data is live DB state — never snapshot it at build time.
export const dynamic = "force-dynamic";

const features = [
  {
    icon: "members",
    title: "For members",
    text: "Join any club, earn points on every visit, redeem coupons for rewards and unlock tier perks as you spend.",
  },
  {
    icon: "business",
    title: "For business",
    text: "Configure your program — points name, earn rate, tiers — then publish rewards and offers, and invite staff to run the counter.",
  },
  {
    icon: "counter",
    title: "At the counter",
    text: "Members check in with a QR code, purchases award points instantly and staff redeem coupons on the spot.",
  },
];

const steps = [
  {
    title: "Create your business",
    text: "Claim a slug, set your points name, earn rate and tiers — your club is live in minutes.",
  },
  {
    title: "Members join with a code or QR",
    text: "Share your club link or a member's referral QR; joining takes a single tap.",
  },
  {
    title: "Earn, redeem, repeat",
    text: "Check-ins award points, tiers unlock perks and coupons redeem at the counter.",
  },
];

const shots = [
  { src: "/shots/club-dashboard.png", caption: "Member club view" },
  { src: "/shots/counter-checkin.png", caption: "Staff counter check-in" },
  { src: "/shots/biz-dashboard.png", caption: "Owner dashboard" },
];

const heading: CSSProperties = { margin: "0 0 6px", fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--ink)" };
const sub: CSSProperties = { margin: "0 0 20px", color: "var(--muted)", fontSize: 15 };

function FeatureIcon({ name }: { name: string }) {
  const icons: Record<string, string> = {
    members: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
    business: "M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm10 12H8V7h8v12zm4 0h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2z",
    counter: "M7 4h-4v16h4V4zm6 0h-4v16h4V4zm2 0v16h7l-3-8 3-8h-7z",
  };
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 44,
      height: 44,
      borderRadius: 12,
      background: "var(--brand-soft)",
      color: "var(--brand)",
      flex: "none",
    }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d={icons[name] ?? icons.members} />
      </svg>
    </span>
  );
}

export default async function LandingPage() {
  const businesses = await prisma.business.findMany({
    orderBy: { createdAt: "asc" },
    take: 9,
    include: {
      program: { select: { pointsName: true } },
      _count: { select: { members: true, offers: { where: liveOfferClause() } } },
    },
  });

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      {/* Hero */}
      <section className="hero-mesh" style={{ padding: "72px 32px", textAlign: "center" }}>
        <div className="scene" style={{ position: "relative", zIndex: 1 }}>
          <div className="tilt">
            <h1
              className="lift text-shimmer float-y"
              style={{
                margin: 0,
                fontSize: 60,
                fontWeight: 800,
                letterSpacing: "-0.03em",
                textShadow: "0 2px 12px rgba(15, 23, 42, 0.25)",
              }}
            >
              LoyaltyClub
            </h1>
            <p
              className="lift-sm"
              style={{ margin: "14px 0 0", fontSize: 22, fontWeight: 600, color: "rgba(255, 255, 255, 0.95)" }}
            >
              A modern loyalty platform for any business
            </p>
            <p
              className="lift-sm"
              style={{
                margin: "16px auto 0",
                maxWidth: 580,
                fontSize: 15,
                lineHeight: 1.65,
                color: "rgba(255, 255, 255, 0.82)",
              }}
            >
              Points, tiers, rewards and offers out of the box. Members check in with a QR code, earn on every
              purchase and redeem coupons at the counter — you configure the rest.
            </p>
            <div
              className="lift"
              style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 32, flexWrap: "wrap" }}
            >
              <Link className="btn" href="/register">
                Start free
              </Link>
              <Link className="btn secondary" href="/login">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Live demo directory */}
      <ScrollReveal as="section">
        <h2 style={heading}>Try the live demo</h2>
        <p style={sub}>Clubs running on this instance right now — open one to browse its program, offers and rewards.</p>
        {businesses.length === 0 ? (
          <div className="card">
            <p className="empty">No businesses yet. Be the first — create your club in under a minute.</p>
          </div>
        ) : (
          <div className="grid cols-3">
            {businesses.map((b, i) => (
              <ScrollReveal key={b.id} delay={(i + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8} direction="up">
                <Link
                  href={`/b/${b.slug}`}
                  className="dir-card"
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{b.name}</h3>
                    <span className="badge">{b.program?.pointsName ?? "points"}</span>
                  </div>
                  <p style={{ margin: 0 }}>
                    <code className="mono">/b/{b.slug}</code>
                  </p>
                  <p style={{ margin: 0, fontSize: 14, color: "var(--muted)" }}>
                    <strong style={{ color: "var(--ink)" }}>{b._count.members}</strong>{" "}
                    {b._count.members === 1 ? "member" : "members"} ·{" "}
                    <strong style={{ color: "var(--ink)" }}>{b._count.offers}</strong> active{" "}
                    {b._count.offers === 1 ? "offer" : "offers"}
                  </p>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        )}
      </ScrollReveal>

      {/* What you get */}
      <ScrollReveal as="section" delay={1}>
        <h2 style={heading}>What you get</h2>
        <p style={sub}>Everything a loyalty club needs — for members, owners and the counter.</p>
        <div className="grid cols-3">
          {features.map((f, i) => (
            <ScrollReveal key={f.title} delay={(i + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8} direction="scale">
              <div className="card hoverable">
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <FeatureIcon name={f.icon} />
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{f.title}</h3>
                </div>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: 14, lineHeight: 1.65 }}>{f.text}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </ScrollReveal>

      {/* Screenshots */}
      <ScrollReveal as="section" delay={2}>
        <h2 style={heading}>See it in action</h2>
        <p style={sub}>The same app from three angles — member, counter and owner console.</p>
        <div className="grid cols-3">
          {shots.map((s, i) => (
            <ScrollReveal key={s.src} delay={(i + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8} direction="left">
              <div className="scene">
                <figure className="shot-frame tilt" style={{ margin: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.src} alt={s.caption} width={1024} height={688} style={{ height: "auto" }} />
                  <figcaption>{s.caption}</figcaption>
                </figure>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </ScrollReveal>

      {/* How it works */}
      <ScrollReveal as="section" delay={3}>
        <h2 style={heading}>How it works</h2>
        <p style={sub}>Three steps from sign-up to a humming loyalty club.</p>
        <div className="card">
          <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 18 }}>
            {steps.map((step, i) => (
              <li key={step.title} className="stagger-item" style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span className="step-chip">{i + 1}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{step.title}</div>
                  <div style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.6 }}>{step.text}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </ScrollReveal>

      <footer style={{ textAlign: "center", color: "var(--muted)", fontSize: 13, paddingTop: 8, paddingBottom: 8 }}>
        Built as a modern loyalty platform — coffee shops, gyms, clothing stores and more.
      </footer>
    </div>
  );
}
