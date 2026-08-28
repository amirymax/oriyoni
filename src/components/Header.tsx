"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CartIcon, CloseIcon, HeartIcon, MenuIcon, SearchIcon } from "@/components/icons";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { products } from "@/lib/products";

const NAV_LINKS = [
  { href: "/shop", label: "Shop All" },
  { href: "/shop?category=Tees", label: "Tees" },
  { href: "/shop?category=Hoodies", label: "Hoodies" },
  { href: "/shop?category=Accessories", label: "Accessories" },
  { href: "/shop?tag=sale", label: "Sale" },
  { href: "/about", label: "About" },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { count: cartCount, openCart } = useCart();
  const { count: wishlistCount } = useWishlist();
  const router = useRouter();

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 5);
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
      <div className="container-shell flex h-16 items-center justify-between gap-4 sm:h-20">
        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="cursor-pointer p-2 text-ink"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-[13px] font-medium uppercase tracking-[0.08em] text-ink transition-colors hover:text-graphite"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/"
          aria-label="ORIYONI home"
          className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2.5"
        >
          <Image
            src="/brand/oriyoni-mark.png"
            alt="ORIYONI crest"
            width={40}
            height={40}
            priority
            className="h-9 w-9 rounded-full object-cover sm:h-10 sm:w-10"
          />
          <span className="font-crest hidden text-lg tracking-[0.2em] text-ink sm:block">
            ORIYONI
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Search"
            aria-expanded={searchOpen}
            className="cursor-pointer p-2 text-ink"
          >
            <SearchIcon className="h-5 w-5" />
          </button>
          <Link
            href="/wishlist"
            aria-label={`Wishlist, ${wishlistCount} items`}
            className="relative hidden cursor-pointer p-2 text-ink sm:inline-flex"
          >
            <HeartIcon className="h-5 w-5" />
            {wishlistCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-ink text-[9px] font-semibold text-white">
                {wishlistCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={openCart}
            aria-label={`Cart, ${cartCount} items`}
            className="relative cursor-pointer p-2 text-ink"
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
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tees, hoodies, accessories…"
              className="w-full bg-transparent text-sm text-ink placeholder:text-ash focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              aria-label="Close search"
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
                      <span>{p.name}</span>
                      <span className="text-ash">{p.category}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 cursor-pointer bg-ink/40"
          />
          <div className="absolute inset-y-0 left-0 flex w-[80%] max-w-xs flex-col bg-white p-6">
            <div className="flex items-center justify-between">
              <span className="font-crest text-base tracking-[0.2em] text-ink">ORIYONI</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="cursor-pointer p-1 text-ink"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            <nav aria-label="Mobile" className="mt-10 flex flex-col gap-6">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
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
                Wishlist
              </Link>
              <Link
                href="/contact"
                onClick={() => setMenuOpen(false)}
                className="text-base font-medium uppercase tracking-[0.08em] text-ink"
              >
                Contact
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
