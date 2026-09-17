"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AcceptInviteButton({ inviteId, businessSlug }: { inviteId: string; businessSlug: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function accept() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/me/invites/${inviteId}/accept`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not accept invite");
        return;
      }
      router.push(`/biz/${data.businessSlug ?? businessSlug}`);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      {error && <span className="error-text" style={{ fontSize: 13 }}>{error}</span>}
      <button className="btn" disabled={busy} onClick={accept}>
        {busy ? "Accepting…" : "Accept"}
      </button>
    </div>
  );
}
