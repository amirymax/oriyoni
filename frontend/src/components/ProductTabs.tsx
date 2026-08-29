"use client";

import { useEffect, useState } from "react";
import { ProductGrid } from "@/components/ProductGrid";
import { useLanguage } from "@/context/LanguageContext";
import { fetchProducts } from "@/lib/catalog";
import type { Product } from "@/lib/products";

const TAB_IDS = ["new", "sale", "bestseller"] as const;
type TabId = (typeof TAB_IDS)[number];

export function ProductTabs() {
  const [active, setActive] = useState<TabId>("new");
  const [products, setProducts] = useState<Product[]>([]);
  const { t } = useLanguage();

  // The home page is a client component, so this section fetches its own
  // slice rather than the whole page becoming server-rendered.
  useEffect(() => {
    let cancelled = false;
    fetchProducts()
      .then((all) => !cancelled && setProducts(all))
      .catch(() => !cancelled && setProducts([]));
    return () => {
      cancelled = true;
    };
  }, []);

  const labels: Record<TabId, string> = {
    new: t.tabNew,
    sale: t.tabSale,
    bestseller: t.tabBestseller,
  };

  const filtered = products.filter((p) => p.tags.includes(active));

  return (
    <div>
      <div
        role="tablist"
        aria-label={t.tabsLabel}
        className="flex gap-6 border-b border-line sm:gap-10"
      >
        {TAB_IDS.map((id) => (
          <button
            key={id}
            role="tab"
            aria-selected={active === id}
            onClick={() => setActive(id)}
            className={`relative cursor-pointer pb-4 text-sm font-medium uppercase tracking-[0.08em] transition-colors ${
              active === id ? "text-ink" : "text-ash hover:text-graphite"
            }`}
          >
            {labels[id]}
            {active === id && (
              <span className="absolute inset-x-0 -bottom-px h-[2px] bg-ink" />
            )}
          </button>
        ))}
      </div>

      <div className="pt-10">
        <ProductGrid products={filtered} />
      </div>
    </div>
  );
}
