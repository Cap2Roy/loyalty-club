"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RedeemButton({
  membershipId,
  rewardId,
  cost,
  points,
  pointsName,
}: {
  membershipId: string;
  rewardId: string;
  cost: number;
  points: number;
  pointsName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const affordable = points >= cost;

  async function redeem() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/me/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId, rewardId }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Redemption failed");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        className="small"
        onClick={redeem}
        disabled={!affordable || busy}
        title={affordable ? "Redeem this reward" : `Requires ${cost} ${pointsName}`}
      >
        {busy ? "Redeeming…" : affordable ? "Redeem" : `Need ${cost - points} more`}
      </button>
      {error && <p className="error-text" style={{ margin: "4px 0 0" }}>{error}</p>}
    </div>
  );
}
