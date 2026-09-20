"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LeaveClubButton({ membershipId, clubName }: { membershipId: string; clubName: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  async function leave() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/me/memberships/${membershipId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not leave club");
        setBusy(false);
        return;
      }
      router.push("/app");
      router.refresh();
    } catch {
      setError("Network error");
      setBusy(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        className="btn secondary small"
        onClick={() => setConfirming(true)}
      >
        Leave club
      </button>
    );
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <span style={{ fontSize: 14, color: "var(--muted)" }}>
        Leave {clubName}? You will lose all your points and coupons.
      </span>
      <button type="button" className="btn bad small" disabled={busy} onClick={leave}>
        {busy ? "Leaving..." : "Yes, leave"}
      </button>
      <button type="button" className="btn secondary small" disabled={busy} onClick={() => setConfirming(false)}>
        Cancel
      </button>
      {error ? <span className="error-text">{error}</span> : null}
    </div>
  );
}
