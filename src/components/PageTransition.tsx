"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * Wraps page content and replays a slide-in animation on every route change.
 * The key prop forces React to remount the wrapper, re-triggering the CSS animation.
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <>{children}</>;

  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}
