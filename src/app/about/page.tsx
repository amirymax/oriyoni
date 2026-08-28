import Image from "next/image";
import Link from "next/link";
import { CrownMark } from "@/components/CrownMark";
import { PageHeader } from "@/components/PageHeader";
import { GarmentMockup } from "@/components/mockups/GarmentMockup";

export const metadata = { title: "Our Story" };

const VALUES = [
  {
    title: "Heavyweight, Always",
    copy: "We don't cut corners on fabric. Every tee starts at 220gsm, every hoodie at 400gsm.",
  },
  {
    title: "Embroidered, Not Printed",
    copy: "The crest is stitched, not screened. It's meant to outlast the season.",
  },
  {
    title: "Deliberate Drops",
    copy: "No filler collections. Every release earns its place in the line.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader title="Our Story" />

      <section className="bg-black text-white">
        <div className="container-shell grid grid-cols-1 items-center gap-12 py-20 sm:py-28 lg:grid-cols-2">
          <div>
            <Image
              src="/brand/oriyoni-mark.png"
              alt="ORIYONI crest"
              width={72}
              height={72}
              className="h-16 w-16 rounded-full object-cover"
            />
            <h1 className="mt-6 font-display text-3xl font-bold uppercase leading-tight tracking-tight sm:text-4xl">
              Quiet confidence, worn daily
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-white/65">
              ORIYONI was built on a simple belief: the clothes you reach for
              every day should feel as considered as the ones you save for
              occasions. We build heavyweight tees and hoodies around a single
              crest — no collaborations, no seasonal noise, just a standard we
              hold ourselves to with every stitch.
            </p>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/65">
              The crown isn&apos;t about status. It&apos;s a reminder to carry
              yourself like the standard is already set.
            </p>
            <Link
              href="/shop"
              className="mt-8 inline-block cursor-pointer bg-white px-7 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-ink transition-colors hover:bg-champagne"
            >
              Shop the Collection
            </Link>
          </div>
          <div className="relative aspect-square bg-charcoal">
            <GarmentMockup garment="hoodie" color="#efe9db" dark={false} className="h-full w-full p-16" />
          </div>
        </div>
      </section>

      <section className="container-shell py-16 sm:py-24">
        <div className="mb-12 text-center">
          <CrownMark className="mx-auto h-8 w-8 text-champagne-ink" />
          <h2 className="mt-4 font-display text-2xl font-bold uppercase tracking-tight text-ink sm:text-3xl">
            What We Stand On
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {VALUES.map((value) => (
            <div key={value.title} className="border-t-2 border-ink pt-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.06em] text-ink">
                {value.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-graphite">{value.copy}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
