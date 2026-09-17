"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type OfferItem = {
  id: string;
  title: string;
  description: string;
  kind: "SALE" | "PROMO";
  discount: string;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
};

export default function OffersManager({ businessId, offers }: { businessId: string; offers: OfferItem[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<"SALE" | "PROMO">("SALE");
  const [discount, setDiscount] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/biz/${businessId}/offers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          kind,
          discount,
          startsAt: startsAt ? new Date(startsAt).toISOString() : undefined,
          endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create offer");
        return;
      }
      setSuccess("Offer created");
      setTitle("");
      setDescription("");
      setDiscount("");
      setStartsAt("");
      setEndsAt("");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(offer: OfferItem) {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/biz/${businessId}/offers/${offer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !offer.active }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not update offer");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  function fmt(value: string | null) {
    return value ? new Date(value).toLocaleDateString() : "—";
  }

  return (
    <div className="card">
      <h2>Offers</h2>
      {error ? <p className="error-text">{error}</p> : null}
      {success ? <p className="success-text">{success}</p> : null}
      {offers.length === 0 ? (
        <p className="empty">No offers yet. Add one below.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Kind</th>
              <th>Discount</th>
              <th>Starts</th>
              <th>Ends</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((offer) => (
              <tr key={offer.id}>
                <td>
                  <div>{offer.title}</div>
                  {offer.description ? <div style={{ opacity: 0.7 }}>{offer.description}</div> : null}
                </td>
                <td>
                  <span className={`badge ${offer.kind === "SALE" ? "warn" : "good"}`}>{offer.kind}</span>
                </td>
                <td>{offer.discount || "—"}</td>
                <td>{fmt(offer.startsAt)}</td>
                <td>{fmt(offer.endsAt)}</td>
                <td>
                  <span className={`badge ${offer.active ? "good" : "muted"}`}>{offer.active ? "Active" : "Inactive"}</span>
                </td>
                <td>
                  <button className="small" disabled={busy} onClick={() => toggle(offer)}>
                    {offer.active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3 style={{ marginTop: 24 }}>New offer</h3>
      <form onSubmit={create}>
        <label>
          Title
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Summer sale" required />
        </label>
        <label>
          Description
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="All drinks" />
        </label>
        <label>
          Kind
          <select value={kind} onChange={(e) => setKind(e.target.value === "PROMO" ? "PROMO" : "SALE")}>
            <option value="SALE">SALE</option>
            <option value="PROMO">PROMO</option>
          </select>
        </label>
        <label>
          Discount
          <input type="text" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="20% off" />
        </label>
        <label>
          Starts at
          <input type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        </label>
        <label>
          Ends at
          <input type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
        </label>
        <p>
          <button type="submit" disabled={busy}>{busy ? "..." : "Create offer"}</button>
        </p>
      </form>
    </div>
  );
}
