"use client";

import { useState } from "react";

type Props = {
  phone: string;
  verified: boolean;
};

type Stage = "idle" | "code-sent" | "verified";

export default function PhoneVerification({ phone, verified }: Props) {
  const [phoneNumber, setPhoneNumber] = useState(phone);
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>(verified ? "verified" : "idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setDevCode(null);
    try {
      const res = await fetch("/api/me/phone/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to send code");
        return;
      }
      setDevCode(data.devCode ?? null);
      setStage("code-sent");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/me/phone/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Verification failed");
        return;
      }
      setStage("verified");
      setDevCode(null);
      setCode("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (stage === "verified") {
    return (
      <span className="badge good">✓ Phone verified{phoneNumber ? ` · ${phoneNumber}` : ""}</span>
    );
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {stage === "idle" && (
        <form onSubmit={sendCode} style={{ display: "grid", gap: 10 }}>
          <label htmlFor="pv-phone">Phone number</label>
          <input
            id="pv-phone"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+1 (555) 000-0000"
            autoComplete="tel"
          />
          {error && <p className="error-text">{error}</p>}
          <div>
            <button type="submit" disabled={busy}>
              {busy ? "Sending…" : "Send code"}
            </button>
          </div>
        </form>
      )}

      {stage === "code-sent" && (
        <form onSubmit={verifyCode} style={{ display: "grid", gap: 10 }}>
          <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
            A 6-digit code was sent to <strong>{phoneNumber}</strong>.
          </p>
          {devCode && (
            <p className="badge muted" style={{ alignSelf: "start" }}>
              Dev code: {devCode}
            </p>
          )}
          <label htmlFor="pv-code">Verification code</label>
          <input
            id="pv-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            maxLength={6}
            required
          />
          {error && <p className="error-text">{error}</p>}
          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" disabled={busy}>
              {busy ? "Verifying…" : "Verify"}
            </button>
            <button
              type="button"
              className="btn secondary"
              onClick={() => {
                setStage("idle");
                setError(null);
                setDevCode(null);
                setCode("");
              }}
            >
              Change number
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
