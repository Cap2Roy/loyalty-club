"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdjustPointsForm({ businessId, membershipId }: { businessId: string; membershipId: string }) {
  const router = useRouter();
  const [delta, setDelta] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/biz/${businessId}/members/${membershipId}/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta: Number(delta), note }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not adjust points");
        return;
      }
      setSuccess(`Adjusted by ${data.membership.points >= 0 ? "+" : ""}${delta}`);
      setDelta("");
      setNote("");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
        <label>
          Delta
          <input
            type="number"
            value={delta}
            onChange={(e) => setDelta(e.target.value)}
            placeholder="+50 / -20"
            required
            style={{ width: 110 }}
          />
        </label>
        <label>
          Note
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Goodwill compensation"
            required
          />
        </label>
        <button type="submit" className="small" disabled={busy}>{busy ? "..." : "Adjust"}</button>
      </div>
      {error ? <p className="error-text">{error}</p> : null}
      {success ? <p className="success-text">{success}</p> : null}
    </form>
  );
}
