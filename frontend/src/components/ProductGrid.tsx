"use client";

import { ProductCard } from "@/components/ProductCard";
import { useLanguage } from "@/context/LanguageContext";
import type { Product } from "@/lib/products";

export function ProductGrid({ products }: { products: Product[] }) {
  const { t } = useLanguage();

  if (products.length === 0) {
    return <p className="py-16 text-center text-sm text-ash">{t.gridEmpty}</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.slug} product={product} />
      ))}
    </div>
  );
}
