"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  CartIcon,
  CloseIcon,
  HeartIcon,
  MenuIcon,
  SearchIcon,
  UserIcon,
} from "@/components/icons";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useWishlist } from "@/context/WishlistContext";
import { categoryLabel } from "@/lib/display";
import { fmt } from "@/lib/i18n";
import { fetchProducts } from "@/lib/catalog";
import type { Product } from "@/lib/products";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { count: cartCount, openCart } = useCart();
  const { isSignedIn } = useAuth();
  const { count: wishlistCount } = useWishlist();
  const { t, l } = useLanguage();
  const router = useRouter();

  // Desktop nav carries the shopping categories only. Everything to the left
  // of the centred logo has to fit in half the viewport, and the Russian
  // labels are much longer than the English ones — "About" lives in the
  // mobile menu and the footer instead.
  const navLinks = [
    { href: "/shop", label: t.navShopAll },
    { href: "/shop?category=Tees", label: t.navTees },
    { href: "/shop?category=Hoodies", label: t.navHoodies },
    { href: "/shop?category=Accessories", label: t.navAccessories },
    { href: "/shop?tag=sale", label: t.navSale },
  ];

  const menuLinks = [
    ...navLinks,
    { href: "/about", label: t.navAbout },
    { href: "/wishlist", label: t.navWishlist },
    isSignedIn
      ? { href: "/account", label: t.authAccount }
      : { href: "/login", label: t.authSignIn },
  ];

  const [results, setResults] = useState<Product[]>([]);

  // Searching in the database rather than over a copy of the catalogue in the
  // bundle, so results stay right as products are added. Debounced, because
  // this fires on every keystroke.
  useEffect(() => {
    const term = query.trim();
    let cancelled = false;

    const timer = setTimeout(() => {
      if (!term) {
        setResults([]);
        return;
      }
      fetchProducts({ search: term })
        .then((found) => !cancelled && setResults(found.slice(0, 5)))
        .catch(() => !cancelled && setResults([]));
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
    setSearchOpen(false);
    setQuery("");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper">
      {/* Three-column grid keeps the logo centred without the nav ever
          overlapping it, whatever length the translated labels are. */}
      <div className="container-shell grid h-16 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:h-20 sm:gap-4">
        <div className="flex min-w-0 items-center xl:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label={t.headerOpenMenu}
            className="cursor-pointer p-1.5 text-ink sm:p-2"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        </div>

        <nav
          aria-label={t.headerNavPrimary}
          className="hidden min-w-0 items-center gap-4 xl:flex 2xl:gap-6"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="nav-underline whitespace-nowrap py-1 text-[12px] font-medium uppercase tracking-[0.06em] text-ink 2xl:text-[13px] 2xl:tracking-[0.08em]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/"
          aria-label={t.headerHome}
          className="flex items-center justify-self-center gap-2.5"
        >
          <Image
            src="/brand/oriyoni-mark.png"
            alt="ORIYONI"
            width={40}
            height={40}
            priority
            className="h-9 w-9 rounded-full object-cover sm:h-10 sm:w-10"
          />
          <span className="font-crest hidden text-lg tracking-[0.2em] text-ink sm:block">
            ORIYONI
          </span>
        </Link>

        <div className="flex items-center justify-self-end gap-1 sm:gap-2">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            aria-label={t.headerSearch}
            aria-expanded={searchOpen}
            className="cursor-pointer p-1.5 text-ink sm:p-2"
          >
            <SearchIcon className="h-5 w-5" />
          </button>
          <Link
            href="/wishlist"
            aria-label={fmt(t.headerWishlistLabel, { n: wishlistCount })}
            className="relative hidden cursor-pointer p-2 text-ink sm:inline-flex"
          >
            <HeartIcon className="h-5 w-5" />
            {wishlistCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-ink text-[9px] font-semibold text-white">
                {wishlistCount}
              </span>
            )}
          </Link>
          <Link
            href={isSignedIn ? "/account" : "/login"}
            aria-label={isSignedIn ? t.authAccount : t.authSignIn}
            className="cursor-pointer p-1.5 text-ink sm:p-2"
          >
            <UserIcon className="h-5 w-5" />
          </Link>
          <button
            type="button"
            onClick={openCart}
            aria-label={fmt(t.headerCartLabel, { n: cartCount })}
            className="relative cursor-pointer p-1.5 text-ink sm:p-2"
          >
            <CartIcon className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-ink text-[9px] font-semibold text-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-line bg-white">
          <form onSubmit={submitSearch} className="container-shell flex items-center gap-3 py-4">
            <SearchIcon className="h-4.5 w-4.5 shrink-0 text-ash" />
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.headerSearchPlaceholder}
              aria-label={t.headerSearch}
              className="w-full bg-transparent text-sm text-ink placeholder:text-ash focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              aria-label={t.headerSearchClose}
              className="cursor-pointer p-1 text-ash hover:text-ink"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </form>
          {results.length > 0 && (
            <div className="container-shell pb-4">
              <ul className="divide-y divide-line border-t border-line">
                {results.map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/product/${p.slug}`}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center justify-between py-3 text-sm text-ink hover:text-graphite"
                    >
                      <span>{l(p.name)}</span>
                      <span className="text-ash">
                        {categoryLabel(p.category, t)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {menuOpen && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <button
            aria-label={t.headerCloseMenu}
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 cursor-pointer bg-ink/40"
          />
          <div className="absolute inset-y-0 left-0 flex w-[80%] max-w-xs flex-col bg-white p-6">
            <div className="flex items-center justify-between">
              <span className="font-crest text-base tracking-[0.2em] text-ink">ORIYONI</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label={t.headerCloseMenu}
                className="cursor-pointer p-1 text-ink"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6">
              <LanguageSwitcher />
            </div>

            <nav aria-label={t.headerNavMobile} className="mt-8 flex flex-col gap-6">
              {menuLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-base font-medium uppercase tracking-[0.08em] text-ink"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/wishlist"
                onClick={() => setMenuOpen(false)}
                className="text-base font-medium uppercase tracking-[0.08em] text-ink"
              >
                {t.navWishlist}
              </Link>
              <Link
                href="/contact"
                onClick={() => setMenuOpen(false)}
                className="text-base font-medium uppercase tracking-[0.08em] text-ink"
              >
                {t.navContact}
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
