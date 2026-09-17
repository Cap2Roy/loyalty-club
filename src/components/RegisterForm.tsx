"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [phoneStep, setPhoneStep] = useState(false);
  const [phoneDone, setPhoneDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Registration failed");
        return;
      }
      if (phone.trim()) {
        // Phone provided: send a verification code before heading to /app.
        const sendRes = await fetch("/api/me/phone/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: phone.trim() }),
        });
        const sendData = await sendRes.json().catch(() => ({}));
        if (!sendRes.ok) {
 setError(sendData.error ?? "Could not send verification code");
          return;
        }
        setDevCode(sendData.devCode ?? null);
        setPhoneStep(true);
      } else {
        goHome();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function goHome() {
    router.push("/app");
    router.refresh();
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setVerifying(true);
    setVerifyError(null);
    try {
      const res = await fetch("/api/me/phone/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verifyCode.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setVerifyError(data.error ?? "Verification failed");
        return;
      }
      setPhoneDone(true);
      goHome();
    } catch {
      setVerifyError("Network error. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  if (phoneStep) {
    return (
      <form onSubmit={verify} className="fade-in">
        <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700 }}>Verify your phone</h3>
        <p style={{ margin: "0 0 16px", fontSize: 14, color: "var(--muted)" }}>
          We sent a 6-digit code to <strong>{phone.trim()}</strong>.
        </p>
        {devCode && (
          <p className="badge muted" style={{ marginBottom: 12 }}>Dev code: {devCode}</p>
        )}
        <label htmlFor="register-code">Verification code</label>
        <input
          id="register-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={verifyCode}
          onChange={(e) => setVerifyCode(e.target.value)}
          placeholder="123456"
          maxLength={6}
          required
        />
        {verifyError && <p className="error-text">{verifyError}</p>}
        {phoneDone && <p className="success-text">Phone verified!</p>}
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 16 }}>
          <button type="submit" disabled={verifying}>{verifying ? "Verifying…" : "Verify"}</button>
          <button
            type="button"
            className="btn secondary"
            onClick={goHome}
          >
            Skip for now
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={submit}>
      <label htmlFor="register-email">Email</label>
      <input
        id="register-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        autoComplete="email"
        required
      />
      <label htmlFor="register-password">Password</label>
      <input
        id="register-password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="At least 8 characters"
        autoComplete="new-password"
        required
      />
      <label htmlFor="register-phone">Phone (optional)</label>
      <input
        id="register-phone"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+1 (555) 000-0000"
        autoComplete="tel"
      />
      {error && <p className="error-text">{error}</p>}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 16 }}>
        <button type="submit" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>
          Already a member? <Link href="/login">Sign in</Link>
        </span>
      </div>
    </form>
  );
}
