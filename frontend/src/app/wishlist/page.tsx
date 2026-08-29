"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { ProductGrid } from "@/components/ProductGrid";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useWishlist } from "@/context/WishlistContext";
import { api, type ApiProduct } from "@/lib/api";
import { fetchProducts, toProduct } from "@/lib/catalog";
import type { Product } from "@/lib/products";

export default function WishlistPage() {
  const { slugs } = useWishlist();
  const { status } = useAuth();
  const { t } = useLanguage();
  const [superset, setSuperset] = useState<Product[] | null>(null);
  const [failed, setFailed] = useState(false);

  // Signed in, the wishlist endpoint already returns full product payloads
  // for exactly what was saved. Signed out, saves only exist as slugs in
  // localStorage, so the whole catalogue has to be fetched and filtered.
  useEffect(() => {
    if (status === "loading") return;

    let cancelled = false;
    setSuperset(null);
    setFailed(false);

    const request =
      status === "authenticated"
        ? api<ApiProduct[]>("/api/wishlist/").then((items) => items.map(toProduct))
        : fetchProducts();

    request
      .then((products) => !cancelled && setSuperset(products))
      .catch(() => {
        if (!cancelled) {
          setSuperset([]);
          setFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [status]);

  const saved = (superset ?? []).filter((product) => slugs.includes(product.slug));

  return (
    <>
      <PageHeader title={t.wishlistTitle} />
      <div className="container-shell py-10 sm:py-14">
        {superset === null ? (
          <p className="py-20 text-center text-sm text-ash">{t.authWorking}</p>
        ) : failed ? (
          <p className="py-20 text-center text-sm text-ash">{t.wishlistError}</p>
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
