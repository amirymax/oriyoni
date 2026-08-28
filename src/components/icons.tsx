import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function SearchIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <circle cx="10.8" cy="10.8" r="6.3" />
      <path d="M20 20l-4.6-4.6" />
    </svg>
  );
}

export function CartIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M3.5 4.5h2l1.2 12.2a2 2 0 0 0 2 1.8h8.3a2 2 0 0 0 2-1.7l1.1-7.3H6.2" />
      <circle cx="9.5" cy="21" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="17" cy="21" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function HeartIcon({ filled, ...props }: IconProps & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" {...base} fill={filled ? "currentColor" : "none"} {...props}>
      <path d="M12 20.2s-7.6-4.6-9.9-9.2C.6 7.6 2 4.3 5.4 3.6c2-.4 3.9.5 5 2.2 1.1-1.7 3-2.6 5-2.2 3.4.7 4.8 4 3.3 7.4-2.3 4.6-9.9 9.2-9.9 9.2Z" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M5 5l14 14M19 5 5 19" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="m5.5 8.5 6.5 7 6.5-7" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M12 4.5v15M4.5 12h15" />
    </svg>
  );
}

export function MinusIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M4.5 12h15" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M4 12h16M13.5 5.5 20 12l-6.5 6.5" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="m4.5 12.5 5 5 10-11" />
    </svg>
  );
}

export function TruckIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M2.5 6.5h11v9h-11z" />
      <path d="M13.5 10h4l3 3.2v2.3h-7z" />
      <circle cx="7" cy="18.2" r="1.6" />
      <circle cx="17" cy="18.2" r="1.6" />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M12 3.2 19.5 6v5.8c0 4.6-3.1 7.7-7.5 9.1-4.4-1.4-7.5-4.5-7.5-9.1V6Z" />
      <path d="m8.8 12.2 2.2 2.2 4.2-4.6" />
    </svg>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M4 12a8 8 0 0 1 13.7-5.7L20 8.6" />
      <path d="M20 4v4.6h-4.6" />
      <path d="M20 12a8 8 0 0 1-13.7 5.7L4 15.4" />
      <path d="M4 20v-4.6h4.6" />
    </svg>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17" cy="7" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TikTokIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M14 3.5c.5 2.4 2 3.9 4.5 4.1v3a7.4 7.4 0 0 1-4.5-1.5v6.4a5.6 5.6 0 1 1-5.6-5.6c.4 0 .8 0 1.1.1v3.1a2.6 2.6 0 1 0 1.8 2.4V3.5Z" />
    </svg>
  );
}

export function TwitterIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M20 5.8a7 7 0 0 1-2.1.6 3.6 3.6 0 0 0 1.6-2 7.3 7.3 0 0 1-2.3.9 3.6 3.6 0 0 0-6.2 3.3A10.3 10.3 0 0 1 3.6 4.9a3.6 3.6 0 0 0 1.1 4.8A3.6 3.6 0 0 1 3 9.2v.1a3.6 3.6 0 0 0 2.9 3.6 3.6 3.6 0 0 1-1.6.06 3.6 3.6 0 0 0 3.4 2.5A7.3 7.3 0 0 1 2.9 17a10.3 10.3 0 0 0 5.6 1.6c6.7 0 10.4-5.6 10.4-10.4v-.5A7.4 7.4 0 0 0 20 5.8Z" />
    </svg>
  );
}
