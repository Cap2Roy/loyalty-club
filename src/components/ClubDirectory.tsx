"use client";

import Link from "next/link";
import JoinClubButton from "./JoinClubButton";

export type DirectoryBusiness = {
  id: string;
  name: string;
  slug: string;
  pointsName: string;
  currency: string;
  earnRate: number;
  members: number;
  activeOffers: number;
};

/** Directory tiles: every business with a join button (or Joined badge) and a link to its public page. */
export default function ClubDirectory({
  businesses,
  joinedSlugs,
}: {
  businesses: DirectoryBusiness[];
  joinedSlugs: string[];
}) {
  const joined = new Set(joinedSlugs);
  if (businesses.length === 0) {
    return (
      <div className="card">
        <p className="empty" style={{ margin: 0 }}>
          No clubs on the platform yet — check back soon.
        </p>
      </div>
    );
  }
  return (
    <div className="grid cols-3">
      {businesses.map((b) => {
        const isJoined = joined.has(b.slug);
        return (
          <div key={b.id} className="card hoverable" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
              <Link href={`/b/${b.slug}`} style={{ fontWeight: 700, color: "var(--ink)" }}>
                {b.name}
              </Link>
              {isJoined ? (
                <span className="badge good">Joined</span>
              ) : (
                <JoinClubButton slug={b.slug} name={b.name} />
              )}
            </div>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
              Earn {b.earnRate} {b.pointsName} per 1 {b.currency} spent
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: "auto" }}>
              <span className="badge muted">{b.members.toLocaleString()} members</span>
              <span className="badge muted">
                {b.activeOffers} active offer{b.activeOffers === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
