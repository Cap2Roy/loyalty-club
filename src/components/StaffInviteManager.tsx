"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Invite = {
  id: string;
  email: string;
  acceptedAt: Date | null;
  createdAt: Date;
  invitee: { email: string } | null;
};

export default function StaffInviteManager({ businessId, invites }: { businessId: string; invites: Invite[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/biz/${businessId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not send invite");
        return;
      }
      setSuccess(`Invited ${email}`);
      setEmail("");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function cancel(inviteId: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/biz/${businessId}/invites/${inviteId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not cancel invite");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <h2>Staff invites</h2>
      <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 0 }}>
        Invite staff by email. They create an account with that email, then accept under My invites.
      </p>
      {error && <p className="error-text">{error}</p>}
      {success && <p className="success-text">{success}</p>}

      {invites.length > 0 && (
        <table style={{ marginBottom: 16 }}>
          <thead>
            <tr>
              <th>Email</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {invites.map((inv) => (
              <tr key={inv.id}>
                <td>{inv.email}</td>
                <td>
                  <span className={`badge ${inv.acceptedAt ? "good" : "muted"}`}>
                    {inv.acceptedAt ? "Accepted" : "Pending"}
                  </span>
                </td>
                <td style={{ textAlign: "right" }}>
                  {!inv.acceptedAt && (
                    <button className="small danger" disabled={busy} onClick={() => cancel(inv.id)}>
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <form onSubmit={invite} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="staff@example.com"
          required
          style={{ flex: 1, minWidth: 200 }}
        />
        <button type="submit" disabled={busy}>{busy ? "…" : "Send invite"}</button>
      </form>
    </div>
  );
}
