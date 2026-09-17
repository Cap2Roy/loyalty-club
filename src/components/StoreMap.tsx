"use client";
import { useEffect, useRef, useState } from "react";

type Store = {
  id: string;
  name: string;
  slug: string;
  address: string;
  latitude: number;
  longitude: number;
  pointsName: string;
  members: number;
  activeOffers: number;
};

// Minimal Leaflet types — the library is loaded dynamically at runtime via CDN.
type LeafletMarker = {
  addTo: (m: LeafletMap) => LeafletMarker;
  bindPopup: (html: string) => void;
};

type LeafletMap = {
  setView: (center: [number, number], zoom: number) => LeafletMap;
  remove: () => void;
  fitBounds: (bounds: unknown, options?: unknown) => void;
};

type LeafletNS = {
  map: (el: HTMLElement) => LeafletMap;
  tileLayer: (url: string, opts: unknown) => { addTo: (m: LeafletMap) => void };
  marker: (latlng: [number, number], opts?: unknown) => LeafletMarker;
  divIcon: (opts: unknown) => unknown;
  latLngBounds: (points: [number, number][]) => { pad: (n: number) => unknown };
};

async function loadLeaflet(): Promise<void> {
  if ((window as unknown as { L?: unknown }).L) return;
  if (document.querySelector('script[data-leaflet-js]')) {
    // Script tag exists but L not ready yet — poll for it.
    const { promise, resolve } = Promise.withResolvers<void>();
    const interval = setInterval(() => {
      if ((window as unknown as { L?: unknown }).L) {
        clearInterval(interval);
        resolve();
      }
    }, 100);
    setTimeout(() => {
      clearInterval(interval);
      resolve(); // give up after 5s; stores list still renders
    }, 5000);
    return promise;
  }
  // Fetch the script and evaluate it as a classic script so it attaches to window.L.
  const res = await fetch("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js");
  if (!res.ok) throw new Error("Failed to load map library");
  const code = await res.text();
  const script = document.createElement("script");
  script.textContent = code;
  script.setAttribute("data-leaflet-js", "true");
  document.head.appendChild(script);
}


/** Escape user-controlled strings before interpolating into HTML strings (Leaflet popups). */
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      case "'": return "&#39;";
      default: return ch;
    }
  });
}
export default function StoreMap({ stores }: { stores: Store[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [locError, setLocError] = useState("");
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    // Load Leaflet CSS
    if (!document.querySelector('link[data-leaflet-css]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.setAttribute("data-leaflet-css", "true");
      document.head.appendChild(link);
    }

    let cancelled = false;

    loadLeaflet().then(() => {
      if (cancelled || !containerRef.current) return;
      const L = (window as unknown as { L?: LeafletNS }).L;
      if (!L) return;

      const hasCoords = stores.filter((s) => s.latitude && s.longitude);

      // Default: NYC. Otherwise average all store coordinates.
      let avg: [number, number] = [40.7128, -74.006];
      if (hasCoords.length > 0) {
        let sumLat = 0;
        let sumLng = 0;
        for (const s of hasCoords) {
          sumLat += s.latitude;
          sumLng += s.longitude;
        }
        avg = [sumLat / hasCoords.length, sumLng / hasCoords.length];
      }

      const map = L.map(containerRef.current).setView(avg, 11);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Add store markers
      for (const s of hasCoords) {
        const marker = L.marker([s.latitude, s.longitude]).addTo(map);
        const offersBadge = s.activeOffers > 0
          ? `<span style="color:#059669;font-weight:600">${s.activeOffers} active offer${s.activeOffers === 1 ? "" : "s"}</span>`
          : "No active offers";
        marker.bindPopup(
          `<div style="font-family:inherit;min-width:180px">` +
          `<div style="font-weight:700;font-size:15px;margin-bottom:4px">${escapeHtml(s.name)}</div>` +
          `<div style="color:#64748b;font-size:13px;margin-bottom:6px">${escapeHtml(s.address || "Address not set")}</div>` +
          `<div style="font-size:13px;margin-bottom:4px"><strong>${s.members}</strong> members &middot; ${escapeHtml(s.pointsName)}</div>` +
          `<div style="font-size:13px;margin-bottom:8px">${offersBadge}</div>` +
          `<a href="/b/${escapeHtml(s.slug)}" style="display:inline-block;padding:4px 12px;border-radius:8px;background:#6366f1;color:#fff;text-decoration:none;font-size:13px;font-weight:600">View club &rarr;</a>` +
          `</div>`,
        );
      }

      setMapReady(true);

      // Try geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (cancelled) return;
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            setUserLat(lat);
            setUserLng(lng);

            const userIcon = L.divIcon({
              html: '<div style="width:16px;height:16px;border-radius:50%;background:#ec4899;border:3px solid #fff;box-shadow:0 0 0 4px rgba(236,72,153,0.3)"></div>',
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            });
            L.marker([lat, lng], { icon: userIcon })
              .addTo(map)
              .bindPopup("<div style='font-weight:600'>You are here</div>");

            // Fit bounds to include user + stores
            const allPoints: [number, number][] = hasCoords.map((s) => [s.latitude, s.longitude]);
            allPoints.push([lat, lng]);
            if (allPoints.length > 1) {
              map.fitBounds(L.latLngBounds(allPoints).pad(0.1));
            }
          },
          (err) => {
            setLocError(err.message || "Location unavailable");
          },
          { enableHighAccuracy: true, timeout: 8000 },
        );
      }
    }).catch(() => {
      setLocError("Failed to load map library");
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [stores]);

  const storesWithCoords = stores.filter((s) => s.latitude && s.longitude);
  const storesWithoutCoords = stores.filter((s) => !s.latitude || !s.longitude);

  return (
    <div>
      <div
        ref={containerRef}
        style={{
          height: 480,
          borderRadius: "var(--radius)",
          overflow: "hidden",
          border: "1px solid var(--line)",
          boxShadow: "var(--shadow-md)",
          zIndex: 0,
        }}
      />

      {!mapReady && !locError && (
        <p style={{ marginTop: 8, fontSize: 13, color: "var(--muted)" }}>Loading map…</p>
      )}
      {locError && (
        <p style={{ marginTop: 8, fontSize: 13, color: "var(--muted)" }}>
          {locError}. Showing all stores below.
        </p>
      )}
      {userLat !== null && (
        <p style={{ marginTop: 8, fontSize: 13, color: "var(--muted)" }}>
          Your location: {userLat.toFixed(4)}, {userLng?.toFixed(4)}
        </p>
      )}

      {storesWithoutCoords.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <h2>Stores without coordinates</h2>
          <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 0 }}>
            These clubs don&apos;t have a location set and won&apos;t appear on the map.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {storesWithoutCoords.map((s) => (
              <a key={s.id} href={`/b/${s.slug}`} className="badge muted">
                {s.name}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Store list below the map */}
      <div className="grid cols-3" style={{ marginTop: 18 }}>
        {storesWithCoords.map((s) => (
          <a key={s.id} href={`/b/${s.slug}`} className="dir-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{s.name}</h3>
              <span className="badge">{s.pointsName}</span>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: "var(--muted)" }}>{s.address || "No address set"}</p>
            <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
              <strong style={{ color: "var(--ink)" }}>{s.members}</strong> members ·{" "}
              <strong style={{ color: "var(--ink)" }}>{s.activeOffers}</strong> offer{s.activeOffers === 1 ? "" : "s"}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
