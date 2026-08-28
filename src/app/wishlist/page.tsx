"use client";

import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { ProductGrid } from "@/components/ProductGrid";
import { useWishlist } from "@/context/WishlistContext";
import { products } from "@/lib/products";

export default function WishlistPage() {
  const { slugs } = useWishlist();
  const saved = products.filter((p) => slugs.includes(p.slug));

  return (
    <>
      <PageHeader title="Wishlist" />
      <div className="container-shell py-10 sm:py-14">
        {saved.length === 0 ? (
          <div className="flex flex-col items-center gap-5 py-20 text-center">
            <p className="text-sm text-ash">Nothing saved yet.</p>
            <Link
              href="/shop"
              className="cursor-pointer bg-ink px-7 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white"
            >
              Browse the Collection
            </Link>
          </div>
        ) : (
          <ProductGrid products={saved} />
        )}
      </div>
    </>
  );
}
