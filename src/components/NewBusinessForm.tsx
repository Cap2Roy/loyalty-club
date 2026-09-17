"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewBusinessForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/biz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create business");
        return;
      }
      router.push(`/biz/${data.business.id}`);
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
        Business name
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Corner Coffee"
          required
        />
      </label>
      {error ? <p className="error-text">{error}</p> : null}
      <p>
        <button type="submit" disabled={busy}>{busy ? "Creating..." : "Create business"}</button>
      </p>
    </form>
  );
}
