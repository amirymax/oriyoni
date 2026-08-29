import { CrownMark } from "@/components/CrownMark";
import type { Garment } from "@/lib/products";

type GarmentMockupProps = {
  garment: Garment;
  color: string;
  dark: boolean;
  className?: string;
};

function strokeFor(dark: boolean) {
  return dark ? "rgba(255,255,255,0.16)" : "rgba(10,10,10,0.18)";
}

function crestColor(dark: boolean) {
  return dark ? "#c9b483" : "#1c1c19";
}

function Tee({ color, dark }: { color: string; dark: boolean }) {
  return (
    <>
      <path
        d="M100 58 62 76 40 118 66 134 82 122 82 250 218 250 218 122 234 134 260 118 238 76 200 58C200 78 172 92 150 92 128 92 100 78 100 58Z"
        fill={color}
        stroke={strokeFor(dark)}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M118 60C122 76 134 86 150 86C166 86 178 76 182 60"
        fill="none"
        stroke={strokeFor(dark)}
        strokeWidth="2"
      />
      <CrownMark
        x="122"
        y="128"
        width="56"
        height="40"
        stroke={crestColor(dark)}
        strokeWidth="3.4"
      />
    </>
  );
}

function Hoodie({ color, dark }: { color: string; dark: boolean }) {
  return (
    <>
      <path
        d="M68 128 46 168 72 184 90 170 90 262 210 262 210 170 228 184 254 168 232 128 192 110C192 76 176 48 150 48 124 48 108 76 108 110Z"
        fill={color}
        stroke={strokeFor(dark)}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M150 48c-16 0-27 16-27 40 0 14 6 26 15 34"
        fill="none"
        stroke={strokeFor(dark)}
        strokeWidth="1.4"
        opacity="0.7"
      />
      <path d="M150 60v58" stroke={strokeFor(dark)} strokeWidth="1.6" />
      <path
        d="M142 138c0 10-3 16-3 24M158 138c0 10 3 16 3 24"
        fill="none"
        stroke={strokeFor(dark)}
        strokeWidth="2"
      />
      <circle cx="139" cy="164" r="2.4" fill={strokeFor(dark)} />
      <circle cx="161" cy="164" r="2.4" fill={strokeFor(dark)} />
      <path
        d="M124 186C134 196 166 196 176 186"
        fill="none"
        stroke={strokeFor(dark)}
        strokeWidth="2"
      />
      <CrownMark
        x="122"
        y="196"
        width="56"
        height="38"
        stroke={crestColor(dark)}
        strokeWidth="3.4"
      />
    </>
  );
}

function Cap({ color, dark }: { color: string; dark: boolean }) {
  return (
    <>
      <path
        d="M84 168C84 118 112 84 150 84 188 84 216 118 216 168Z"
        fill={color}
        stroke={strokeFor(dark)}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M78 168h150c14 0 30 8 40 22-10 6-24 8-36 4L214 176H90l-18 18c-12 4-26 2-36-4 10-14 26-22 42-22Z"
        fill={color}
        stroke={strokeFor(dark)}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M150 84v84" stroke={strokeFor(dark)} strokeWidth="1.6" />
      <CrownMark
        x="122"
        y="118"
        width="56"
        height="40"
        stroke={crestColor(dark)}
        strokeWidth="3.4"
      />
    </>
  );
}

function Beanie({ color, dark }: { color: string; dark: boolean }) {
  return (
    <>
      <path
        d="M92 176C88 128 112 78 150 78 188 78 212 128 208 176Z"
        fill={color}
        stroke={strokeFor(dark)}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <rect
        x="86"
        y="168"
        width="128"
        height="34"
        rx="4"
        fill={color}
        stroke={strokeFor(dark)}
        strokeWidth="2"
      />
      <path d="M150 78c10 30 10 62 0 98" stroke={strokeFor(dark)} strokeWidth="1.6" />
      <CrownMark
        x="122"
        y="176"
        width="56"
        height="22"
        stroke={crestColor(dark)}
        strokeWidth="3.4"
      />
    </>
  );
}

function Tote({ color, dark }: { color: string; dark: boolean }) {
  return (
    <>
      <path
        d="M108 96c0-20 14-34 42-34s42 14 42 34"
        fill="none"
        stroke={strokeFor(dark)}
        strokeWidth="4"
      />
      <rect
        x="76"
        y="96"
        width="148"
        height="148"
        rx="6"
        fill={color}
        stroke={strokeFor(dark)}
        strokeWidth="2"
      />
      <CrownMark
        x="122"
        y="150"
        width="56"
        height="40"
        stroke={crestColor(dark)}
        strokeWidth="3.4"
      />
    </>
  );
}

export function GarmentMockup({ garment, color, dark, className }: GarmentMockupProps) {
  const Body =
    garment === "tee"
      ? Tee
      : garment === "hoodie"
        ? Hoodie
        : garment === "cap"
          ? Cap
          : garment === "beanie"
            ? Beanie
            : Tote;

  return (
    <svg viewBox="0 0 300 300" className={className} role="img" aria-hidden="true">
      <Body color={color} dark={dark} />
    </svg>
  );
}
