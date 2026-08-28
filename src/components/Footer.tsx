import Image from "next/image";
import Link from "next/link";
import { InstagramIcon, TikTokIcon, TwitterIcon } from "@/components/icons";

const SHOP_LINKS = [
  { href: "/shop?category=Tees", label: "Tees" },
  { href: "/shop?category=Hoodies", label: "Hoodies" },
  { href: "/shop?category=Accessories", label: "Accessories" },
  { href: "/shop?tag=sale", label: "Sale" },
];

const HELP_LINKS = [
  { href: "/contact", label: "Contact Us" },
  { href: "/shop", label: "Shipping & Returns" },
  { href: "/shop", label: "Size Guide" },
  { href: "/cart", label: "Track Order" },
];

const COMPANY_LINKS = [
  { href: "/about", label: "Our Story" },
  { href: "/about", label: "Craft & Materials" },
  { href: "/contact", label: "Wholesale" },
];

export function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="container-shell grid grid-cols-1 gap-12 py-16 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <Image
              src="/brand/oriyoni-mark.png"
              alt="ORIYONI crest"
              width={44}
              height={44}
              className="h-11 w-11 rounded-full object-cover"
            />
            <span className="font-crest text-xl tracking-[0.2em] text-white">ORIYONI</span>
          </div>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/60">
            Heavyweight tees and hoodies built on quiet confidence. Wear the crown.
          </p>
          <div className="mt-6 flex items-center gap-4 text-white/70">
            <Link href="#" aria-label="ORIYONI on Instagram" className="hover:text-white">
              <InstagramIcon className="h-5 w-5" />
            </Link>
            <Link href="#" aria-label="ORIYONI on TikTok" className="hover:text-white">
              <TikTokIcon className="h-5 w-5" />
            </Link>
            <Link href="#" aria-label="ORIYONI on Twitter" className="hover:text-white">
              <TwitterIcon className="h-5 w-5" />
            </Link>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/50">
            Shop
          </h3>
          <ul className="mt-5 space-y-3">
            {SHOP_LINKS.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="text-sm text-white/80 hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/50">
            Help
          </h3>
          <ul className="mt-5 space-y-3">
            {HELP_LINKS.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="text-sm text-white/80 hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/50">
            Company
          </h3>
          <ul className="mt-5 space-y-3">
            {COMPANY_LINKS.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="text-sm text-white/80 hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-shell flex flex-col items-center justify-between gap-3 py-6 text-xs text-white/50 sm:flex-row">
          <p>© {new Date().getFullYear()} ORIYONI. All rights reserved.</p>
          <p>Designed with intent. Made for the crowned.</p>
        </div>
      </div>
    </footer>
  );
}
