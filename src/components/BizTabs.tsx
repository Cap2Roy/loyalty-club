"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BizTabs({ businessId }: { businessId: string }) {
  const pathname = usePathname();
  const base = `/biz/${businessId}`;
  const tabs = [
    { href: base, label: "Dashboard" },
    { href: `${base}/members`, label: "Members" },
    { href: `${base}/rewards`, label: "Rewards" },
    { href: `${base}/offers`, label: "Offers" },
    { href: `${base}/settings`, label: "Settings" },
  ];

  return (
    <nav style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
      {tabs.map((tab) => {
        const active = tab.href === base ? pathname === base : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={active ? "btn" : "btn ghost"}
            style={active ? { fontWeight: 700 } : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
