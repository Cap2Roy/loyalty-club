"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinClubButton({ slug, name }: { slug: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function join() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/me/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not join this club");
        return;
      }
      router.push(`/app/club/${slug}`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button type="button" className="small" onClick={join} disabled={busy} title={`Join ${name}`}>
        {busy ? "Joining…" : "Join"}
      </button>
      {error && <p className="error-text" style={{ margin: "4px 0 0" }}>{error}</p>}
    </div>
  );
}
