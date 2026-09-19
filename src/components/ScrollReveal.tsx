"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Direction = "up" | "left" | "right" | "scale";

const classMap: Record<Direction, string> = {
  up: "reveal",
  left: "reveal-slide-left",
  right: "reveal-slide-right",
  scale: "reveal-scale",
};

export default function ScrollReveal({
  children,
  delay = 0,
  direction = "up",
  as: Tag = "div",
  className = "",
  style,
}: {
  children: ReactNode;
  delay?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  direction?: Direction;
  as?: "div" | "section" | "li" | "article";
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const baseClass = classMap[direction];
  const classes = [baseClass, className].filter(Boolean).join(" ");

  return (
    <Tag
      ref={ref as never}
      className={classes}
      data-delay={delay || undefined}
      style={style}
    >
      {children}
    </Tag>
  );
}
