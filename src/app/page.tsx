"use client";

import Link from "next/link";
import { CategoryBanners } from "@/components/CategoryBanners";
import { CrownMark } from "@/components/CrownMark";
import { Hero } from "@/components/Hero";
import { Newsletter } from "@/components/Newsletter";
import { ProductTabs } from "@/components/ProductTabs";
import { TrustBar } from "@/components/TrustBar";
import { useLanguage } from "@/context/LanguageContext";

export default function HomePage() {
  const { t } = useLanguage();

  const pillars = [t.manifestoCut, t.manifestoCotton, t.manifestoCrest];

  return (
    <>
      <Hero />
      <CategoryBanners />

      <section className="container-shell py-16 sm:py-24">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow text-xs text-champagne-ink">{t.collectionEyebrow}</p>
            <h2 className="mt-2 font-display text-3xl font-bold uppercase tracking-tight text-ink sm:text-4xl">
              {t.collectionHeading}
            </h2>
          </div>
          <Link
            href="/shop"
            className="text-xs font-semibold uppercase tracking-[0.1em] text-ink underline underline-offset-4"
          >
            {t.collectionViewAll}
          </Link>
        </div>
        <ProductTabs />
      </section>

      <TrustBar />

      <section className="bg-black text-white">
        <div className="container-shell grid grid-cols-1 items-center gap-10 py-20 sm:py-28 lg:grid-cols-2">
          <div>
            <CrownMark className="h-10 w-10 text-champagne" aria-hidden="true" />
            <h2 className="mt-6 font-display text-3xl font-bold uppercase leading-tight tracking-tight sm:text-4xl">
              {t.manifestoHeading}
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-white/65">
              {t.manifestoBody}
            </p>
            <Link
              href="/about"
              className="mt-8 inline-block cursor-pointer border border-white/40 px-7 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:border-white"
            >
              {t.manifestoCta}
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3 opacity-90">
            {pillars.map((label) => (
              <div
                key={label}
                className="flex aspect-square flex-col items-center justify-center gap-2 border border-white/15 p-4 text-center"
              >
                <CrownMark className="h-5 w-5 text-white/50" aria-hidden="true" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/70">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Newsletter />
    </>
  );
}
