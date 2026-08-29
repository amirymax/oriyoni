"use client";

import Image from "next/image";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { InstagramIcon, TikTokIcon, TwitterIcon } from "@/components/icons";
import { useLanguage } from "@/context/LanguageContext";
import { fmt } from "@/lib/i18n";

export function Footer() {
  const { t } = useLanguage();

  const shopLinks = [
    { href: "/shop?category=Tees", label: t.navTees },
    { href: "/shop?category=Hoodies", label: t.navHoodies },
    { href: "/shop?category=Accessories", label: t.navAccessories },
    { href: "/shop?tag=sale", label: t.navSale },
  ];

  const helpLinks = [
    { href: "/contact", label: t.footerContactUs },
    { href: "/shop", label: t.footerShippingReturns },
    { href: "/shop", label: t.footerSizeGuide },
    { href: "/cart", label: t.footerTrackOrder },
  ];

  const companyLinks = [
    { href: "/about", label: t.footerOurStory },
    { href: "/about", label: t.footerCraft },
    { href: "/contact", label: t.footerWholesale },
  ];

  return (
    <footer
      className="tab-bar-inset bg-black text-white"
      style={{ viewTransitionName: "site-footer" }}
    >
      <div className="container-shell grid grid-cols-1 gap-12 py-16 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <Image
              src="/brand/oriyoni-mark.png"
              alt="ORIYONI"
              width={44}
              height={44}
              className="h-11 w-11 rounded-full object-cover"
            />
            <span className="font-crest text-xl tracking-[0.2em] text-white">ORIYONI</span>
          </div>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/60">
            {t.footerTagline}
          </p>
          <div className="mt-6 flex items-center gap-4 text-white/70">
            <Link href="#" aria-label={t.footerInstagram} className="hover:text-white">
              <InstagramIcon className="h-5 w-5" />
            </Link>
            <Link href="#" aria-label={t.footerTikTok} className="hover:text-white">
              <TikTokIcon className="h-5 w-5" />
            </Link>
            <Link href="#" aria-label={t.footerTwitter} className="hover:text-white">
              <TwitterIcon className="h-5 w-5" />
            </Link>
          </div>
          <div className="mt-7">
            <LanguageSwitcher tone="dark" />
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/50">
            {t.footerShop}
          </h3>
          <ul className="mt-5 space-y-3">
            {shopLinks.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="text-sm text-white/80 hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/50">
            {t.footerHelp}
          </h3>
          <ul className="mt-5 space-y-3">
            {helpLinks.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="text-sm text-white/80 hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/50">
            {t.footerCompany}
          </h3>
          <ul className="mt-5 space-y-3">
            {companyLinks.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="text-sm text-white/80 hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-shell flex flex-col items-center justify-between gap-3 py-6 text-xs text-white/50 sm:flex-row">
          <p>{fmt(t.footerRights, { year: new Date().getFullYear() })}</p>
          <p>{t.footerMotto}</p>
        </div>
      </div>
    </footer>
  );
}
