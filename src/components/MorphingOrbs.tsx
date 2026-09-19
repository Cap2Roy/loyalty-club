"use client";

/**
 * Animated morphing gradient orbs — fixed background layer.
 * Sits behind all content (z-index: 0). Pure CSS animation, no JS runtime cost.
 */
export default function MorphingOrbs() {
  return (
    <div className="orbs" aria-hidden="true">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="orb orb-4" />
    </div>
  );
}
