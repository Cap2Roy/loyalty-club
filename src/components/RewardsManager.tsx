"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type RewardItem = {
  id: string;
  title: string;
  description: string;
  cost: number;
  expiresInDays: number | null;
  active: boolean;
};

export default function RewardsManager({ businessId, rewards }: { businessId: string; rewards: RewardItem[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCost, setEditCost] = useState("");

  function startEdit(reward: RewardItem) {
    setEditingId(reward.id);
    setEditTitle(reward.title);
    setEditCost(String(reward.cost));
    setError("");
    setSuccess("");
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/biz/${businessId}/rewards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, cost: Number(cost), expiresInDays: expiresInDays.trim() === "" ? null : Number(expiresInDays) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create reward");
        return;
      }
      setSuccess("Reward created");
      setTitle("");
      setDescription("");
      setCost("");
      setExpiresInDays("");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit(id: string) {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/biz/${businessId}/rewards/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, cost: Number(editCost) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not update reward");
        return;
      }
      setSuccess("Reward updated");
      setEditingId(null);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(reward: RewardItem) {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/biz/${businessId}/rewards/${reward.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !reward.active }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not update reward");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function remove(reward: RewardItem) {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/biz/${businessId}/rewards/${reward.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not delete reward");
        return;
      }
      setSuccess("Reward deleted");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <h2>Rewards</h2>
      {error ? <p className="error-text">{error}</p> : null}
      {success ? <p className="success-text">{success}</p> : null}
      {rewards.length === 0 ? (
        <p className="empty">No rewards yet. Add one below.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Cost</th>
              <th>Expires</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rewards.map((reward) => (
              <tr key={reward.id}>
                <td>
                  {editingId === reward.id ? (
                    <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                  ) : (
                    <>
                      <div>{reward.title}</div>
                      {reward.description ? <div style={{ opacity: 0.7 }}>{reward.description}</div> : null}
                    </>
                  )}
                </td>
                <td>
                  {editingId === reward.id ? (
                    <input type="number" value={editCost} onChange={(e) => setEditCost(e.target.value)} style={{ width: 90 }} />
                  ) : (
                    reward.cost
                  )}
                </td>
                <td>{reward.expiresInDays != null ? `${reward.expiresInDays}d` : "Never"}</td>
                <td>
                  <span className={`badge ${reward.active ? "good" : "muted"}`}>{reward.active ? "Active" : "Inactive"}</span>
                </td>
                <td>
                  {editingId === reward.id ? (
                    <>
                      <button className="small" disabled={busy} onClick={() => saveEdit(reward.id)}>Save</button>{" "}
                      <button className="small ghost" onClick={() => setEditingId(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="small secondary" disabled={busy} onClick={() => startEdit(reward)}>Edit</button>{" "}
                      <button className="small" disabled={busy} onClick={() => toggle(reward)}>
                        {reward.active ? "Deactivate" : "Activate"}
                      </button>{" "}
                      <button className="small danger" disabled={busy} onClick={() => remove(reward)}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3 style={{ marginTop: 24 }}>New reward</h3>
      <form onSubmit={create}>
        <label>
          Title
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Free latte" required />
        </label>
        <label>
          Description
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Any size" />
        </label>
        <label>
          Cost (points)
          <input type="number" value={cost} onChange={(e) => setCost(e.target.value)} min={1} required />
        </label>
        <label>
          Coupons expire after (days, blank = never)
          <input type="number" value={expiresInDays} onChange={(e) => setExpiresInDays(e.target.value)} min={1} placeholder="30" />
        </label>
        <p>
          <button type="submit" disabled={busy}>{busy ? "..." : "Create reward"}</button>
        </p>
      </form>
    </div>
  );
}
