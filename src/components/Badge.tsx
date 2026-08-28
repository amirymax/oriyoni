import type { ReactNode } from "react";

type BadgeTone = "ink" | "champagne" | "outline";

export function Badge({
  children,
  tone = "ink",
  className = "",
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  const toneClasses: Record<BadgeTone, string> = {
    ink: "bg-ink text-white",
    champagne: "bg-champagne text-ink",
    outline: "border border-ink/70 text-ink",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
