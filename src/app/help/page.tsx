import Link from "next/link";
import { KB_CATEGORIES, KNOWLEDGE_BASE } from "@/lib/knowledge-base";

export const metadata = { title: "Help & Support" };

export default function HelpPage() {
  const byCategory = KB_CATEGORIES.map((cat) => ({
    category: cat,
    entries: KNOWLEDGE_BASE.filter((e) => e.category === cat),
  }));

  return (
    <div className="fade-in" style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <Link href="/" className="btn secondary small">← Home</Link>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>Help &amp; Support</h1>
      </div>

      <div className="card" style={{
        background: "var(--gradient-brand)",
        color: "#fff",
        border: "none",
        boxShadow: "var(--shadow-xl), var(--inset-edge-strong)",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, background: "radial-gradient(circle, rgba(255,255,255,0.15), transparent 70%)", pointerEvents: "none" }} />
        <div style={{ padding: "8px 0", position: "relative" }}>
          <h2 style={{ margin: "0 0 6px", color: "#fff", fontSize: 18, fontWeight: 700 }}>
            💬 Ask the assistant
          </h2>
          <p style={{ margin: 0, opacity: 0.9, fontSize: 14 }}>
            Use the chat button in the bottom-right corner to ask questions anytime.
            The assistant searches our knowledge base and answers instantly.
          </p>
        </div>
      </div>

      {/* Category navigation pills */}
      <div className="subnav">
        {byCategory.map(({ category, entries }) => (
          <a key={category} href={`#${category.toLowerCase().replace(/\s+/g, "-")}`}>
            {category} ({entries.length})
          </a>
        ))}
      </div>

      {byCategory.map(({ category, entries }) => (
        <div key={category} className="card card-3d" id={category.toLowerCase().replace(/\s+/g, "-")}>
          <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 10,
              background: "var(--gradient-brand)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 800,
              boxShadow: "var(--shadow-brand)",
            }}>
              {category.charAt(0)}
            </span>
            {category}
          </h2>
          <div style={{ display: "grid", gap: 16 }}>
            {entries.map((entry) => (
              <details key={entry.id} style={{
                border: "1px solid var(--line)",
                borderRadius: "var(--radius-sm)",
                padding: 0,
                overflow: "hidden",
                transition: "box-shadow var(--transition), border-color var(--transition)",
              }}>
                <summary style={{
                  padding: "14px 16px",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                  listStyle: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  transition: "background var(--transition)",
                }}>
                  {entry.question}
                  <span style={{
                    color: "var(--muted)",
                    fontSize: 18,
                    fontWeight: 300,
                    flexShrink: 0,
                  }}>+</span>
                </summary>
                <div style={{
                  padding: "0 16px 14px",
                  color: "var(--ink-soft)",
                  fontSize: 14,
                  lineHeight: 1.6,
                }}>
                  {entry.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      ))}

      <div className="card card-3d" style={{ textAlign: "center" }}>
        <h2>Still need help?</h2>
        <p style={{ color: "var(--muted)", fontSize: 14 }}>
          Use the chat assistant (bottom-right button) for instant answers from our knowledge base,
          or browse the categories above.
        </p>
      </div>
    </div>
  );
}
