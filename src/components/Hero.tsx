import Link from "next/link";
import { CrownMark } from "@/components/CrownMark";
import { ArrowRightIcon } from "@/components/icons";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-black text-white">
      <CrownMark className="pointer-events-none absolute left-1/2 top-1/2 h-[140%] w-[140%] -translate-x-1/2 -translate-y-1/2 text-white/[0.04]" />

      <div className="container-shell relative flex flex-col items-center py-24 text-center sm:py-32">
        <p className="eyebrow text-xs text-champagne">Est. in the pursuit of quiet confidence</p>
        <h1 className="mt-6 max-w-3xl text-[2.5rem] font-bold uppercase leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
          Wear the
          <br />
          Crown
        </h1>
        <p className="mt-6 max-w-md text-sm text-white/65 sm:text-base">
          Heavyweight tees and hoodies, cut clean and built to last. No noise —
          just the crest.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/shop?category=Tees"
            className="cursor-pointer bg-white px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-ink transition-colors hover:bg-champagne"
          >
            Shop Tees
          </Link>
          <Link
            href="/shop?category=Hoodies"
            className="inline-flex cursor-pointer items-center justify-center gap-2 border border-white/40 px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:border-white"
          >
            Shop Hoodies
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
