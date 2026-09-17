"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const MEMBER_LINKS = [
  { href: "/app", label: "My clubs" },
  { href: "/app/join", label: "Join a club" },
  { href: "/app/map", label: "Map" },
  { href: "/app/account", label: "Account" },
];

export default function TopBar({ userName }: { userName: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const isBusiness = pathname.startsWith("/biz") || pathname.startsWith("/counter");

  const links = isBusiness ? [] : MEMBER_LINKS;
  const authHref = pathname.startsWith("/biz") || pathname.startsWith("/counter") ? "/counter" : "/login";

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <Link href="/" className="logo">◆ LoyaltyClub</Link>
        <nav>
          {userName && links.map((l) => (
            <Link key={l.href} href={l.href} className={pathname === l.href ? "active" : ""}>{l.label}</Link>
          ))}
          {userName && (
            <Link href="/biz" className={isBusiness ? "active" : ""}>Business</Link>
          )}
          <Link href="/help" className={pathname === "/help" ? "active" : ""}>Help</Link>
        </nav>
        {userName ? (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span className="badge muted">{userName}</span>
            <button className="secondary small" onClick={signOut}>Sign out</button>
          </div>
        ) : (
          <Link href={authHref} className="btn small">Sign in</Link>
        )}
      </div>
    </header>
  );
}
