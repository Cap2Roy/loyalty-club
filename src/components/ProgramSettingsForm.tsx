"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type ProgramValues = {
  pointsName: string;
  earnRate: number;
  minRedeem: number;
  currency: string;
  tierNames: string;
  tierThresholds: string;
};

export default function ProgramSettingsForm({ businessId, program }: { businessId: string; program: ProgramValues }) {
  const router = useRouter();
  const [pointsName, setPointsName] = useState(program.pointsName);
  const [earnRate, setEarnRate] = useState(String(program.earnRate));
  const [minRedeem, setMinRedeem] = useState(String(program.minRedeem));
  const [currency, setCurrency] = useState(program.currency);
  const [tierNames, setTierNames] = useState(program.tierNames);
  const [tierThresholds, setTierThresholds] = useState(program.tierThresholds);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/biz/${businessId}/program`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pointsName,
          earnRate: Number(earnRate),
          minRedeem: Number(minRedeem),
          currency,
          tierNames,
          tierThresholds,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save settings");
        return;
      }
      setSuccess("Program settings saved");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <label>
        Points name
        <input type="text" value={pointsName} onChange={(e) => setPointsName(e.target.value)} placeholder="stars" required />
      </label>
      <label>
        Earn rate ({pointsName || "points"} per 1 {currency || "USD"} spent)
        <input type="number" value={earnRate} onChange={(e) => setEarnRate(e.target.value)} min={1} required />
      </label>
      <label>
        Minimum redemption
        <input type="number" value={minRedeem} onChange={(e) => setMinRedeem(e.target.value)} min={0} required />
      </label>
      <label>
        Currency
        <input type="text" value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="USD" required />
      </label>
      <label>
        Tier names (comma-separated, lowest first)
        <input type="text" value={tierNames} onChange={(e) => setTierNames(e.target.value)} placeholder="Member, Gold, Platinum" required />
      </label>
      <label>
        Tier spend thresholds (comma-separated, one fewer than tier names)
        <input type="text" value={tierThresholds} onChange={(e) => setTierThresholds(e.target.value)} placeholder="200, 500" />
      </label>
      {error ? <p className="error-text">{error}</p> : null}
      {success ? <p className="success-text">{success}</p> : null}
      <p>
        <button type="submit" disabled={busy}>{busy ? "Saving..." : "Save settings"}</button>
      </p>
    </form>
  );
}
