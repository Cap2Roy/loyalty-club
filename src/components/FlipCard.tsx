"use client";

import { useState } from "react";

export default function FlipCard({
  businessName,
  points,
  pointsName,
  tier,
  currency,
  lifetimeSpend,
  lifetimeEarned,
  qrDataUrl,
  referralCode,
}: {
  businessName: string;
  points: number;
  pointsName: string;
  tier: string;
  currency: string;
  lifetimeSpend: number;
  lifetimeEarned: number;
  qrDataUrl: string;
  referralCode: string;
}) {
  const [flipped, setFlipped] = useState(false);

  const cardStyle: React.CSSProperties = {
    borderRadius: "var(--radius-lg)",
    overflow: "hidden",
    background: "var(--gradient-brand)",
    color: "#fff",
    boxShadow: "var(--shadow-2xl), var(--inset-edge-strong)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    position: "relative",
  };

  const shineOverlay = (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "40%", background: "linear-gradient(180deg, rgba(255,255,255,0.12), transparent)", pointerEvents: "none", zIndex: 1 }} />
  );

  return (
    <div className="flip-card" onClick={() => setFlipped(!flipped)}>
      <div className={`flip-card-inner ${flipped ? "flipped" : ""}`} style={cardStyle}>
        {/* FRONT: card info */}
        <div className="flip-card-front" style={cardStyle}>
          {shineOverlay}
          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{ padding: "24px 28px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.75 }}>
                Loyalty card
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4, letterSpacing: "-0.02em" }}>
                {businessName}
              </div>
            </div>
            <div style={{ padding: "16px 28px 4px", textAlign: "center" }}>
              <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.03em" }}>
                {points.toLocaleString()}
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 6 }}>
                {pointsName}
              </div>
            </div>
            <div style={{ padding: "12px 28px", textAlign: "center" }}>
              <span style={{
                display: "inline-block",
                padding: "5px 16px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.22)",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.04em",
              }}>
                {tier}
              </span>
            </div>
            <div style={{ padding: "0 28px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 12, opacity: 0.6, marginTop: 8 }}>
                Tap card to flip →
              </div>
            </div>
            <div style={{
              display: "flex",
              justifyContent: "space-around",
              padding: "18px 28px 24px",
              borderTop: "1px solid rgba(255,255,255,0.18)",
              fontSize: 13,
            }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 800 }}>
                  {currency} {lifetimeSpend.toFixed(2)}
                </div>
                <div style={{ opacity: 0.7, fontSize: 12, marginTop: 2 }}>Lifetime spend</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 800 }}>
                  {lifetimeEarned.toLocaleString()}
                </div>
                <div style={{ opacity: 0.7, fontSize: 12, marginTop: 2 }}>{pointsName} earned</div>
              </div>
            </div>
          </div>
        </div>

        {/* BACK: QR code */}
        <div className="flip-card-back" style={cardStyle}>
          {shineOverlay}
          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{ padding: "24px 28px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.75 }}>
                Referral QR
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4, letterSpacing: "-0.02em" }}>
                {businessName}
              </div>
            </div>
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
                alt={`QR code to join ${businessName}`}
                width={200}
                height={200}
                style={{ display: "block", margin: "0 auto", borderRadius: 8, imageRendering: "pixelated" }}
              />
              <div style={{ marginTop: 12, fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", color: "#1a1a2e", textTransform: "uppercase" }}>
                Referral code
              </div>
              <code
                className="mono"
                style={{ display: "inline-block", marginTop: 4, fontSize: 15, fontWeight: 600, color: "#1a1a2e", background: "rgba(0,0,0,0.05)", borderColor: "rgba(0,0,0,0.1)" }}
              >
                {referralCode}
              </code>
            </div>
            <div style={{ padding: "0 28px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 12, opacity: 0.6 }}>
                ← Tap card to flip back
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
