"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinForm({ initialSlug = "" }: { initialSlug?: string }) {
  const router = useRouter();
  const [slug, setSlug] = useState(initialSlug);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
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
      router.push(`/app/club/${slug.trim().toLowerCase()}`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <label htmlFor="join-slug">Club name or invite code</label>
      <input
        id="join-slug"
        type="text"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        placeholder="e.g. blue-bottle-coffee"
        required
      />
      {error && <p className="error-text">{error}</p>}
      <div style={{ marginTop: 16 }}>
        <button type="submit" disabled={busy || !slug.trim()}>
          {busy ? "Joining…" : "Join club"}
        </button>
      </div>
    </form>
  );
}
