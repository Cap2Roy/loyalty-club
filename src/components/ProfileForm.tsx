"use client";

import { useState } from "react";

export default function ProfileForm({
  initialName,
  initialPhone,
  email,
}: {
  initialName: string;
  initialPhone: string;
  email: string;
}) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Update failed");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <label htmlFor="profile-email">Email</label>
      <input id="profile-email" type="email" value={email} disabled style={{ opacity: 0.6 }} />

      <label htmlFor="profile-name">Display name</label>
      <input
        id="profile-name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
      />

      <label htmlFor="profile-phone">Phone</label>
      <input
        id="profile-phone"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+1 (555) 000-0000"
      />

      {error && <p className="error-text">{error}</p>}
      {success && <p className="success-text">Profile saved.</p>}
      <div style={{ marginTop: 16 }}>
        <button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save profile"}
        </button>
      </div>
    </form>
  );
}
