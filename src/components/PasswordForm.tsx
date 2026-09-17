"use client";

import { useState } from "react";

export default function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Password change failed");
        return;
      }
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <label htmlFor="pw-current">Current password</label>
      <input
        id="pw-current"
        type="password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        autoComplete="current-password"
        required
      />

      <label htmlFor="pw-new">New password</label>
      <input
        id="pw-new"
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        autoComplete="new-password"
        placeholder="At least 8 characters"
        required
      />

      <label htmlFor="pw-confirm">Confirm new password</label>
      <input
        id="pw-confirm"
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        autoComplete="new-password"
        required
      />

      {error && <p className="error-text">{error}</p>}
      {success && <p className="success-text">Password changed successfully.</p>}
      <div style={{ marginTop: 16 }}>
        <button type="submit" disabled={busy}>
          {busy ? "Changing…" : "Change password"}
        </button>
      </div>
    </form>
  );
}
