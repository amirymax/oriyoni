"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronDownIcon } from "@/components/icons";
import { ProductGrid } from "@/components/ProductGrid";
import { categories, products, type ProductTag } from "@/lib/products";

type CategoryFilter = "All" | (typeof categories)[number];
type SortId = "newest" | "price-asc" | "price-desc";

const SORTS: { id: SortId; label: string }[] = [
  { id: "newest", label: "Newest" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
];

export function ShopClient({
  initialCategory,
  initialTag,
  initialQuery,
}: {
  initialCategory?: string;
  initialTag?: string;
  initialQuery?: string;
}) {
  const [category, setCategory] = useState<CategoryFilter>(
    (categories as readonly string[]).includes(initialCategory ?? "")
      ? (initialCategory as CategoryFilter)
      : "All"
  );
  const [tag, setTag] = useState<ProductTag | null>(
    initialTag === "new" || initialTag === "sale" || initialTag === "bestseller"
      ? initialTag
      : null
  );
  const query = initialQuery ?? "";
  const [sort, setSort] = useState<SortId>("newest");

  const filtered = useMemo(() => {
    let list = products.slice();

    if (category !== "All") {
      list = list.filter((p) => p.category === category);
    }
    if (tag) {
      list = list.filter((p) => p.tags.includes(tag));
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }

    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list.sort((a, b) => b.price - a.price);

    return list;
  }, [category, tag, query, sort]);

  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <FilterPill
            active={category === "All" && !tag}
            onClick={() => {
              setCategory("All");
              setTag(null);
            }}
          >
            All
          </FilterPill>
          {categories.map((c) => (
            <FilterPill
              key={c}
              active={category === c}
              onClick={() => {
                setCategory(c);
                setTag(null);
              }}
            >
              {c}
            </FilterPill>
          ))}
          <FilterPill active={tag === "sale"} onClick={() => setTag(tag === "sale" ? null : "sale")}>
            Sale
          </FilterPill>
        </div>

        <div className="flex items-center gap-3">
          {query && (
            <p className="text-xs text-ash">
              Results for <span className="text-ink">&ldquo;{query}&rdquo;</span>{" "}
              <Link href="/shop" className="underline underline-offset-2 hover:text-ink">
                Clear
              </Link>
            </p>
          )}
          <div className="relative">
            <select
              aria-label="Sort products"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortId)}
              className="cursor-pointer appearance-none border border-line bg-white py-2 pl-3 pr-8 text-xs font-medium uppercase tracking-[0.06em] text-ink focus:outline-none"
            >
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ash" />
          </div>
        </div>
      </div>

      <p className="py-6 text-xs text-ash">
        {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
      </p>

      <ProductGrid products={filtered} />
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`cursor-pointer border px-4 py-2 text-xs font-medium uppercase tracking-[0.06em] transition-colors ${
        active
          ? "border-ink bg-ink text-white"
          : "border-line bg-white text-ink hover:border-ink"
      }`}
    >
      {children}
    </button>
  );
}
