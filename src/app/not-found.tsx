import Link from "next/link";
import { CrownMark } from "@/components/CrownMark";

export default function NotFound() {
  return (
    <div className="container-shell flex flex-col items-center py-32 text-center">
      <CrownMark className="h-12 w-12 text-ink/30" />
      <h1 className="mt-6 font-display text-3xl font-bold uppercase tracking-tight text-ink">
        Page Not Found
      </h1>
      <p className="mt-3 max-w-sm text-sm text-ash">
        This page doesn&apos;t exist — the piece you&apos;re looking for may
        have moved or sold out.
      </p>
      <Link
        href="/"
        className="mt-8 cursor-pointer bg-ink px-7 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white"
      >
        Back to Home
      </Link>
    </div>
  );
}
