"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function BizTabs({ businessId }: { businessId: string }) {
  const pathname = usePathname();
  const base = `/biz/${businessId}`;
  const navRef = useRef<HTMLElement>(null);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);
  const tabs = [
    { href: base, label: "Dashboard" },
    { href: `${base}/members`, label: "Members" },
    { href: `${base}/rewards`, label: "Rewards" },
    { href: `${base}/offers`, label: "Offers" },
    { href: `${base}/coupons`, label: "Coupons" },
    { href: `${base}/settings`, label: "Settings" },
  ];

  // Slide the nav indicator under the active link
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const activeEl = nav.querySelector("a.active") as HTMLElement | null;
    if (activeEl) {
      setIndicator({ left: activeEl.offsetLeft, width: activeEl.offsetWidth });
    } else {
      setIndicator(null);
    }
  }, [pathname, businessId]);

  return (
    <nav ref={navRef} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16, position: "relative" }}>
      {tabs.map((tab) => {
        const active = tab.href === base ? pathname === base : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={active ? "btn active" : "btn ghost"}
            style={active ? { fontWeight: 700 } : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
      {indicator && (
        <span
          className="nav-indicator"
          style={{ left: indicator.left, width: indicator.width }}
        />
      )}
    </nav>
  );
}
