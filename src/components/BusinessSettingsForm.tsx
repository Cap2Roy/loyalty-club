"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type BusinessValues = {
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
};

export default function BusinessSettingsForm({ businessId, business }: { businessId: string; business: BusinessValues }) {
  const router = useRouter();
  const [name, setName] = useState(business.name);
  const [address, setAddress] = useState(business.address);
  const [latitude, setLatitude] = useState(business.latitude != null ? String(business.latitude) : "");
  const [longitude, setLongitude] = useState(business.longitude != null ? String(business.longitude) : "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const latNum = latitude.trim() === "" ? null : Number(latitude);
      const lngNum = longitude.trim() === "" ? null : Number(longitude);
      const res = await fetch(`/api/biz/${businessId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          address,
          latitude: latNum,
          longitude: lngNum,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save business info");
        return;
      }
      setSuccess("Business info saved");
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
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Blue Cup Coffee" required />
      </label>
      <label>
        Address
        <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, Springfield" />
      </label>
      <label>
        Latitude
        <input type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="40.7128" />
      </label>
      <label>
        Longitude
        <input type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="-74.006" />
      </label>
      <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 0 }}>
        Set latitude and longitude to appear on the store map. Leave both blank to hide.
      </p>
      {error ? <p className="error-text">{error}</p> : null}
      {success ? <p className="success-text">{success}</p> : null}
      <p>
        <button type="submit" disabled={busy}>{busy ? "Saving..." : "Save business info"}</button>
      </p>
    </form>
  );
}
