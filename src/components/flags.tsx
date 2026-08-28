import type { SVGProps } from "react";

type FlagProps = SVGProps<SVGSVGElement>;

/** Union Jack — used to represent the English language option. */
export function FlagGB(props: FlagProps) {
  return (
    <svg viewBox="0 0 60 30" aria-hidden="true" {...props}>
      <clipPath id="oriyoni-flag-gb-clip">
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <rect width="60" height="30" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" strokeWidth="6" />
      <path
        d="M0,0 L60,30 M60,0 L0,30"
        clipPath="url(#oriyoni-flag-gb-clip)"
        stroke="#C8102E"
        strokeWidth="4"
      />
      <path d="M30,0 V30 M0,15 H60" stroke="#FFFFFF" strokeWidth="10" />
      <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}

/** Flag of the Russian Federation. */
export function FlagRU(props: FlagProps) {
  return (
    <svg viewBox="0 0 60 30" aria-hidden="true" {...props}>
      <rect width="60" height="10" fill="#FFFFFF" />
      <rect y="10" width="60" height="10" fill="#0039A6" />
      <rect y="20" width="60" height="10" fill="#D52B1E" />
      {/* Keeps the white band readable on light surfaces */}
      <rect
        x="0.5"
        y="0.5"
        width="59"
        height="29"
        fill="none"
        stroke="rgba(0,0,0,0.22)"
        strokeWidth="1"
      />
    </svg>
  );
}
