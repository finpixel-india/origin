"use client";

import { useId } from "react";

/**
 * Abstract feline-inspired mark for ORIGIN — built from angular geometry.
 * Original design: two pointed ears, a sleek muzzle, slit eyes, and a single
 * restrained amethyst "gem". Not affiliated with any existing brand.
 */
export function LogoMark({
  size = 34,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const id = useId().replace(/[:]/g, "");
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`fill-${id}`} x1="24" y1="5" x2="24" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2a2a38" />
          <stop offset="1" stopColor="#101017" />
        </linearGradient>
        <radialGradient id={`glow-${id}`} cx="24" cy="20" r="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7c6cc4" stopOpacity="0.5" />
          <stop offset="1" stopColor="#7c6cc4" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* amethyst aura */}
      <circle cx="24" cy="22" r="18" fill={`url(#glow-${id})`} />

      {/* head silhouette */}
      <path
        d="M14 17 L20 5 L24 14 L28 5 L34 17 L40 30 L24 44 L8 30 Z"
        fill={`url(#fill-${id})`}
        stroke="rgba(206,206,216,0.42)"
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* internal geometry */}
      <g stroke="rgba(206,206,216,0.5)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M24 14 L24 19" />
        <path d="M16 22 L24 40 L32 22" />
        <path d="M18 25 L23 23" />
        <path d="M30 25 L25 23" />
        <path d="M14 17 L24 19 L34 17" />
      </g>

      {/* amethyst gem / nose */}
      <path d="M24 18 L26.6 21 L24 24 L21.4 21 Z" fill="#9788db" />
    </svg>
  );
}

export function Logo({
  size = 34,
  showWord = true,
  tagline = false,
  className = "",
}: {
  size?: number;
  showWord?: boolean;
  tagline?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoMark size={size} />
      {showWord && (
        <div className="leading-none">
          <div
            className="text-[1.15rem] font-medium tracking-[0.42em] text-silver-50"
            style={{ fontFamily: "var(--font-display)" }}
          >
            ORIGIN
          </div>
          {tagline && (
            <div className="mt-1.5 text-[0.55rem] uppercase tracking-[0.38em] text-silver-600">
              Personal&nbsp;OS
            </div>
          )}
        </div>
      )}
    </div>
  );
}
