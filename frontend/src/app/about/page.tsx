"use client";

import Image from "next/image";
import Link from "next/link";
import { CrownMark } from "@/components/CrownMark";
import { PageHeader } from "@/components/PageHeader";
import { GarmentMockup } from "@/components/mockups/GarmentMockup";
import { useLanguage } from "@/context/LanguageContext";

export default function AboutPage() {
  const { t } = useLanguage();

  const values = [
    { title: t.aboutValue1Title, copy: t.aboutValue1Copy },
    { title: t.aboutValue2Title, copy: t.aboutValue2Copy },
    { title: t.aboutValue3Title, copy: t.aboutValue3Copy },
  ];

  return (
    <>
      <PageHeader title={t.aboutTitle} />

      <section className="bg-black text-white">
        <div className="container-shell grid grid-cols-1 items-center gap-12 py-20 sm:py-28 lg:grid-cols-2">
          <div>
            <Image
              src="/brand/oriyoni-mark.png"
              alt="ORIYONI"
              width={72}
              height={72}
              className="h-16 w-16 rounded-full object-cover"
            />
            <h2 className="mt-6 font-display text-3xl font-bold uppercase leading-tight tracking-tight sm:text-4xl">
              {t.aboutHeading}
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-white/65">
              {t.aboutBody1}
            </p>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/65">
              {t.aboutBody2}
            </p>
            <Link
              href="/shop"
              className="mt-8 inline-block cursor-pointer bg-white px-7 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-ink transition-colors hover:bg-champagne"
            >
              {t.aboutCta}
            </Link>
          </div>
          <div className="relative aspect-square bg-charcoal">
            <GarmentMockup
              garment="hoodie"
              color="#efe9db"
              dark={false}
              className="h-full w-full p-16"
            />
          </div>
        </div>
      </section>

      <section className="container-shell py-16 sm:py-24">
        <div className="mb-12 text-center">
          <CrownMark className="mx-auto h-8 w-8 text-champagne-ink" aria-hidden="true" />
          <h2 className="mt-4 font-display text-2xl font-bold uppercase tracking-tight text-ink sm:text-3xl">
            {t.aboutValuesHeading}
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {values.map((value) => (
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
