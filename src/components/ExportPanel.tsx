"use client";

import { useState } from "react";

export default function ExportPanel({ businessId }: { businessId: string }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  function buildUrl(format: "csv" | "json") {
    const params = new URLSearchParams({ format });
    if (from) params.set("from", new Date(from).toISOString());
    if (to) params.set("to", new Date(to).toISOString());
    return `/api/biz/${businessId}/export?${params.toString()}`;
  }

  function download(format: "csv" | "json") {
    window.location.href = buildUrl(format);
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 12 }}>
        <label>
          From
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label>
          To
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <button type="button" className="btn small" onClick={() => download("csv")}>
          Export CSV
        </button>
        <button type="button" className="btn secondary small" onClick={() => download("json")}>
          Export JSON
        </button>
      </div>
      <p className="badge muted">CSV works with QuickBooks, Xero, and FreshBooks.</p>
    </div>
  );
}
