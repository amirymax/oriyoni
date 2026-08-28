"use client";

import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { GarmentMockup } from "@/components/mockups/GarmentMockup";
import { useLanguage } from "@/context/LanguageContext";

export function CategoryBanners() {
  const { t } = useLanguage();

  const banners = [
    {
      href: "/shop?category=Tees",
      label: t.navTees,
      copy: t.bannerTeesCopy,
      garment: "tee" as const,
    },
    {
      href: "/shop?category=Hoodies",
      label: t.navHoodies,
      copy: t.bannerHoodiesCopy,
      garment: "hoodie" as const,
    },
  ];

  return (
    <section className="container-shell py-16 sm:py-24">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {banners.map((banner) => (
          <Link
            key={banner.href}
            href={banner.href}
            className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden bg-charcoal p-8 sm:aspect-[5/6]"
          >
            <GarmentMockup
              garment={banner.garment}
              color="#efe9db"
              dark={false}
              className="absolute inset-0 h-full w-full p-14 opacity-90 transition-transform duration-500 ease-out group-hover:scale-105 sm:p-20"
            />
            <div className="relative">
              <h3 className="font-display text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl">
                {banner.label}
              </h3>
              <p className="mt-2 max-w-xs text-sm text-white/70">{banner.copy}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-white">
                {t.bannerShopNow}
                <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
