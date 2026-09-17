"use client";

import { useState } from "react";

type BusinessRef = { id: string; name: string; slug: string };
type MembershipRef = { id: string; business: BusinessRef };

type Referral = {
  id: string;
  code: string;
  status: string;
  bonusPoints: number;
  refereeBonus: number;
  createdAt: string;
  expiresAt: string | null;
  claimedAt: string | null;
  sourceBusiness: { name: string; slug: string } | null;
  targetBusiness: { name: string; slug: string } | null;
};

export default function ReferralShare({
  userMemberships,
  allBusinesses,
  existingReferrals,
}: {
  userMemberships: MembershipRef[];
  allBusinesses: BusinessRef[];
  existingReferrals: Referral[];
}) {
  const [sourceId, setSourceId] = useState(userMemberships[0]?.business.id ?? "");
  const [targetId, setTargetId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ code: string; referrerBonus: number; refereeBonus: number; targetSlug: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [referrals, setReferrals] = useState(existingReferrals);

  const targetOptions = allBusinesses.filter((b) => b.id !== sourceId);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCreated(null);
    if (!sourceId) {
      setError("Select a source club");
      return;
    }
    if (!targetId) {
      setError("Select a target club");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/me/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceBusinessId: sourceId, targetBusinessId: targetId }),
      });
      const data = (await res.json()) as { error?: string; referral?: Referral };
      if (!res.ok) {
        setError(data.error ?? "Could not create referral");
        return;
      }
      const r = data.referral!;
      setCreated({ code: r.code, referrerBonus: r.bonusPoints, refereeBonus: r.refereeBonus, targetSlug: r.targetBusiness?.slug ?? "" });
      setReferrals((prev) => [r, ...prev]);
      setTargetId("");
      setCopied(false);
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  function copyCode() {
    if (!created) return;
    navigator.clipboard.writeText(created.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const shareLink = created
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/app/club/${created.targetSlug}`
    : "";

  return (
    <div>
      {userMemberships.length === 0 ? (
        <p className="empty" style={{ margin: 0 }}>Join a club first to start making referrals.</p>
      ) : (
        <>
          {error && <p className="error-text">{error}</p>}

          <form onSubmit={create} style={{ display: "grid", gap: 10, marginBottom: 16 }}>
            <label style={{ display: "grid", gap: 4, fontSize: 13, color: "var(--muted)" }}>
              Your club (referrer)
              <select value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
                {userMemberships.map((m) => (
                  <option key={m.business.id} value={m.business.id}>{m.business.name}</option>
                ))}
              </select>
            </label>
            <label style={{ display: "grid", gap: 4, fontSize: 13, color: "var(--muted)" }}>
              Target club
              <select value={targetId} onChange={(e) => setTargetId(e.target.value)}>
                <option value="">Select a club…</option>
                {targetOptions.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </label>
            <button type="submit" className="btn small" disabled={busy || !targetId}>
              {busy ? "Creating…" : "Create referral code"}
            </button>
          </form>

          {created && (
            <div className="card" style={{ marginBottom: 16, background: "var(--brand-soft)" }}>
              <p style={{ margin: "0 0 4px", fontWeight: 600 }}>Referral code created!</p>
              <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--muted)" }}>
                You earn {created.referrerBonus} points when a friend joins. They get {created.refereeBonus} points too.
              </p>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
                <code className="mono">{created.code}</code>
                <button type="button" className="btn secondary small" onClick={copyCode}>
                  {copied ? "Copied!" : "Copy code"}
                </button>
              </div>
              {shareLink && (
                <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                  Share link: <a href={shareLink}>{shareLink}</a>
                </p>
              )}
            </div>
          )}

          {referrals.length > 0 && (
            <div>
              <h3 style={{ margin: "0 0 8px", fontSize: 14 }}>Your referral codes</h3>
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>From → To</th>
                    <th>Status</th>
                    <th>Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((r) => (
                    <tr key={r.id}>
                      <td><code className="mono">{r.code}</code></td>
                      <td style={{ fontSize: 13 }}>
                        {r.sourceBusiness?.name ?? "—"} → {r.targetBusiness?.name ?? "—"}
                      </td>
                      <td>
                        <span className={`badge ${r.status === "CLAIMED" ? "good" : r.status === "EXPIRED" ? "bad" : "muted"}`}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ whiteSpace: "nowrap", fontSize: 13 }}>
                        {r.expiresAt ? new Date(r.expiresAt).toLocaleDateString() : "Never"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
