"use client";

import { useMemo, useState } from "react";
import { ProductGrid } from "@/components/ProductGrid";
import { products } from "@/lib/products";

const TABS = [
  { id: "new", label: "New Arrivals" },
  { id: "sale", label: "Sale" },
  { id: "bestseller", label: "Best Sellers" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ProductTabs() {
  const [active, setActive] = useState<TabId>("new");

  const filtered = useMemo(
    () => products.filter((p) => p.tags.includes(active)),
    [active]
  );

  return (
    <div>
      <div
        role="tablist"
        aria-label="Product collections"
        className="flex gap-6 border-b border-line sm:gap-10"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => setActive(tab.id)}
            className={`relative cursor-pointer pb-4 text-sm font-medium uppercase tracking-[0.08em] transition-colors ${
              active === tab.id ? "text-ink" : "text-ash hover:text-graphite"
            }`}
          >
            {tab.label}
            {active === tab.id && (
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
