"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
  related?: { id: string; question: string; category: string }[];
};

type APIResponse = {
  reply?: string;
  match?: { id: string; question: string; category: string };
  related?: { id: string; question: string; category: string }[];
  error?: string;
};

const QUICK_QUESTIONS = [
  "How do I earn points?",
  "How do I join a club?",
  "What are cross-store referrals?",
  "How do I verify my phone?",
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Hi! I'm the LoyaltyClub assistant. Ask me anything about points, rewards, referrals, or how to use the app.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    setInput("");
    setBusy(true);
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = (await res.json()) as APIResponse;

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.reply || "I couldn't find an answer. Try visiting the Help page for more info.",
          related: data.related,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Sorry, I had trouble connecting. Please try again.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div
          className="panel-slide-up"
          style={{
            position: "fixed",
            bottom: 84,
            right: 24,
            width: 380,
            maxWidth: "calc(100vw - 32px)",
            height: 480,
            maxHeight: "calc(100vh - 120px)",
            background: "var(--surface-glass)",
            backdropFilter: "blur(24px) saturate(1.8)",
            WebkitBackdropFilter: "blur(24px) saturate(1.8)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-2xl)",
            display: "flex",
            flexDirection: "column",
            zIndex: 9999,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 18px",
              background: "var(--gradient-brand)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.2)",
                  fontSize: 16,
                }}
              >
                💬
              </span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Assistant</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Powered by knowledge base</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                color: "#fff",
                borderRadius: 8,
                padding: "4px 10px",
                cursor: "pointer",
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              background: "var(--bg)",
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                  gap: 4,
                }}
              >
                <div
                  style={{
                    maxWidth: "85%",
                    padding: "10px 14px",
                    borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background: msg.role === "user" ? "var(--brand)" : "var(--surface)",
                    color: msg.role === "user" ? "#fff" : "var(--ink)",
                    border: msg.role === "user" ? "none" : "1px solid var(--line)",
                    fontSize: 14,
                    lineHeight: 1.5,
                  }}
                >
                  {msg.text}
                </div>
                {msg.related && msg.related.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, maxWidth: "85%" }}>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>Related:</span>
                    {msg.related.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => send(r.question)}
                        style={{
                          textAlign: "left",
                          fontSize: 13,
                          padding: "6px 12px",
                          borderRadius: 999,
                          border: "1px solid var(--line)",
                          background: "var(--surface)",
                          color: "var(--brand)",
                          cursor: "pointer",
                        }}
                      >
                        {r.question}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {busy && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--muted)", fontSize: 13 }}>
                <span style={{ animation: "pulse 1s ease-in-out infinite" }}>●</span>
                <span style={{ animation: "pulse 1s ease-in-out 0.2s infinite" }}>●</span>
                <span style={{ animation: "pulse 1s ease-in-out 0.4s infinite" }}>●</span>
                <span style={{ marginLeft: 4 }}>Searching…</span>
              </div>
            )}

            {/* Quick questions (only show on first exchange) */}
            {messages.length === 1 && !busy && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>Quick questions:</span>
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => send(q)}
                    style={{
                      textAlign: "left",
                      fontSize: 13,
                      padding: "8px 14px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--line)",
                      background: "var(--surface)",
                      color: "var(--ink-soft)",
                      cursor: "pointer",
                      transition: "border-color var(--transition), color var(--transition)",
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            style={{
              padding: "12px",
              borderTop: "1px solid var(--line)",
              display: "flex",
              gap: 8,
              flexShrink: 0,
              background: "var(--surface)",
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              maxLength={500}
              style={{ flex: 1 }}
              autoFocus
            />
            <button type="submit" disabled={busy || !input.trim()} className="btn small">
              Send
            </button>
          </form>

          {/* Help page link */}
          <div style={{ padding: "0 12px 10px", textAlign: "center" }}>
            <Link href="/help" style={{ fontSize: 12, color: "var(--muted)" }} onClick={() => setOpen(false)}>
              Browse all help topics →
            </Link>
          </div>
        </div>
      )}

      {/* Floating button with pulse ring */}
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999 }}>
        {!open && (
          <span
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "var(--brand)",
              animation: "pulse-ring 2s ease-out infinite",
            }}
          />
        )}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close chat" : "Open chat"}
          style={{
            position: "relative",
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: open ? "var(--ink-soft)" : "var(--gradient-brand)",
            border: "none",
            color: "#fff",
            fontSize: 24,
            cursor: "pointer",
            boxShadow: "var(--shadow-brand-xl), var(--inset-edge-strong)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow var(--transition)",
          }}
        >
          {open ? "✕" : "💬"}
        </button>
      </div>
    </>
  );
}
