"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { ProductGrid } from "@/components/ProductGrid";
import { useLanguage } from "@/context/LanguageContext";
import { useWishlist } from "@/context/WishlistContext";
import { fetchProducts } from "@/lib/catalog";
import type { Product } from "@/lib/products";

export default function WishlistPage() {
  const { slugs } = useWishlist();
  const { t } = useLanguage();
  const [catalogue, setCatalogue] = useState<Product[] | null>(null);

  // The saved list is slugs; the grid needs whole products. Fetching the
  // catalogue once and filtering beats a request per saved item.
  useEffect(() => {
    let cancelled = false;
    fetchProducts()
      .then((all) => !cancelled && setCatalogue(all))
      .catch(() => !cancelled && setCatalogue([]));
    return () => {
      cancelled = true;
    };
  }, []);

  const saved = (catalogue ?? []).filter((product) => slugs.includes(product.slug));

  return (
    <>
      <PageHeader title={t.wishlistTitle} />
      <div className="container-shell py-10 sm:py-14">
        {catalogue === null ? (
          <p className="py-20 text-center text-sm text-ash">{t.authWorking}</p>
        ) : saved.length === 0 ? (
          <div className="flex flex-col items-center gap-5 py-20 text-center">
            <p className="text-sm text-ash">{t.wishlistEmpty}</p>
            <Link
              href="/shop"
              className="cursor-pointer bg-ink px-7 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white"
            >
              {t.wishlistCta}
            </Link>
          </div>
        ) : (
          <ProductGrid products={saved} />
        )}
      </div>
    </>
  );
}
