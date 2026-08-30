"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { ChevronDownIcon } from "@/components/icons";
import { PageHeader } from "@/components/PageHeader";
import { ProductGrid } from "@/components/ProductGrid";
import { useLanguage } from "@/context/LanguageContext";
import { categoryLabel } from "@/lib/display";
import { categories, type Product, type ProductTag } from "@/lib/products";

type CategoryFilter = "All" | (typeof categories)[number];
type SortId = "newest" | "price-asc" | "price-desc";

export function ShopClient({
  products,
  initialCategory,
  initialTag,
  initialQuery,
}: {
  /** Fetched by the page so the first paint already has the grid. */
  products: Product[];
  initialCategory?: string;
  initialTag?: string;
  initialQuery?: string;
}) {
  const { t, count } = useLanguage();
  const router = useRouter();

  const category: CategoryFilter = (categories as readonly string[]).includes(
    initialCategory ?? ""
  )
    ? (initialCategory as CategoryFilter)
    : "All";
  const tag: ProductTag | null =
    initialTag === "new" || initialTag === "sale" || initialTag === "bestseller"
      ? initialTag
      : null;
  const [sort, setSort] = useState<SortId>("newest");
  const query = initialQuery ?? "";

  // The products this page received were already narrowed server-side to
  // this exact category/tag/query combination (see app/shop/page.tsx), so
  // switching filters has to navigate rather than just filter in place —
  // otherwise a pill could only ever narrow within an already-narrowed set.
  function go(nextCategory: CategoryFilter, nextTag: ProductTag | null) {
    const params = new URLSearchParams();
    if (nextCategory !== "All") params.set("category", nextCategory);
    if (nextTag) params.set("tag", nextTag);
    if (query) params.set("q", query);
    const qs = params.toString();
    router.push(qs ? `/shop?${qs}` : "/shop");
  }

  const sorts: { id: SortId; label: string }[] = [
    { id: "newest", label: t.sortNewest },
    { id: "price-asc", label: t.sortPriceAsc },
    { id: "price-desc", label: t.sortPriceDesc },
  ];

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
      list = list.filter((p) =>
        [p.name.en, p.name.ru].some((n) => n.toLowerCase().includes(q))
      );
    }

    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list.sort((a, b) => b.price - a.price);

    return list;
  }, [products, category, tag, query, sort]);

  return (
    <>
      <PageHeader title={t.shopTitle} description={t.shopDescription} />

      <div className="container-shell py-10 sm:py-14">
        <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <FilterPill active={category === "All" && !tag} onClick={() => go("All", null)}>
              {t.filterAll}
            </FilterPill>
            {categories.map((c) => (
              <FilterPill key={c} active={category === c} onClick={() => go(c, null)}>
                {categoryLabel(c, t)}
              </FilterPill>
            ))}
            <FilterPill
              active={tag === "sale"}
              onClick={() => go(category, tag === "sale" ? null : "sale")}
            >
              {t.navSale}
            </FilterPill>
          </div>

          <div className="flex items-center gap-3">
            {query && (
              <p className="text-xs text-ash">
                {t.resultsFor} <span className="text-ink">&ldquo;{query}&rdquo;</span>{" "}
                <Link href="/shop" className="underline underline-offset-2 hover:text-ink">
                  {t.resultsClear}
                </Link>
              </p>
            )}
            <div className="relative">
              <select
                aria-label={t.sortLabel}
                value={sort}
                onChange={(e) => setSort(e.target.value as SortId)}
                className="cursor-pointer appearance-none border border-line bg-white py-2 pl-3 pr-8 text-xs font-medium uppercase tracking-[0.06em] text-ink focus:border-ink focus:outline-none"
              >
                {sorts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ash" />
            </div>
          </div>
        </div>

        <p className="py-6 text-xs text-ash">{count(filtered.length)}</p>

        <ProductGrid products={filtered} />
      </div>
    </>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
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
