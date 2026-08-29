import type { SVGProps } from "react";

/**
 * Simplified three-point crown motif echoing the ORIYONI mark.
 * Used as a decorative UI accent (dividers, watermarks, bullets) —
 * the photographic brand mark itself is used wherever pixel-accurate
 * logo reproduction is needed (header, hero, footer).
 */
export function CrownMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 100 72"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M8 30 L23 46 L37 26 L50 4 L63 26 L77 46 L92 30" />
      <path d="M8 30 L14 58 M92 30 L86 58" />
      <path d="M14 58 H86" />
    </svg>
  );
}
