"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/Badge";
import { HeartIcon } from "@/components/icons";
import { ProductVisual } from "@/components/ProductVisual";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useWishlist } from "@/context/WishlistContext";
import { fmt } from "@/lib/i18n";
import { fetchProduct } from "@/lib/catalog";
import type { Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  const [colorIndex, setColorIndex] = useState(0);
  const [adding, setAdding] = useState(false);
  const { addItem } = useCart();
  const { isSaved, toggle } = useWishlist();
  const { t, l, price } = useLanguage();

  const color = product.colors[colorIndex];
  const saved = isSaved(product.slug);
  const discount =
    product.compareAtPrice != null
      ? Math.round(100 - (product.price / product.compareAtPrice) * 100)
      : null;

  // The list payload leaves variants out to stay small, so the SKU for this
  // colour in the first available size is fetched only when someone actually
  // reaches for quick add.
  async function quickAdd() {
    setAdding(true);
    try {
      const detail = await fetchProduct(product.slug);
      const variant = detail?.variants.find(
        (v) => v.color === color.id && v.in_stock
      );
      if (variant) await addItem(variant.sku);
    } catch {
      // Nothing to say on a card; the product page reports properly.
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="group relative flex flex-col">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-card">
        <Link href={`/product/${product.slug}`} className="block h-full w-full">
          <ProductVisual
            photos={product.photos}
            colorId={color.id}
            garment={product.garment}
            hex={color.hex}
            dark={color.dark}
            alt={l(product.name)}
            className="h-full w-full transition-transform duration-300 ease-out group-hover:scale-[1.04]"
          />
        </Link>

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {discount != null && <Badge tone="ink">-{discount}%</Badge>}
          {product.tags.includes("new") && (
            <Badge tone="champagne">{t.badgeNew}</Badge>
          )}
          {product.tags.includes("bestseller") && (
            <Badge tone="outline" className="bg-white/90">
              {t.badgeBestseller}
            </Badge>
          )}
        </div>

        <button
          type="button"
          onClick={() => toggle(product.slug)}
          aria-label={saved ? t.removeFromWishlist : t.addToWishlist}
          aria-pressed={saved}
          className="absolute right-3 top-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/90 text-ink transition-colors hover:bg-white"
        >
          <HeartIcon filled={saved} className="h-4.5 w-4.5" />
        </button>

        {product.colors.length > 1 && (
          <div className="absolute bottom-3 left-3 flex gap-1.5">
            {product.colors.map((c, i) => (
              <button
                key={c.id}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setColorIndex(i);
                }}
                aria-label={fmt(t.viewColor, { color: l(c.name) })}
                aria-pressed={i === colorIndex}
                className="h-5 w-5 cursor-pointer rounded-full border border-white shadow-sm"
                style={{
                  backgroundColor: c.hex,
                  outline: i === colorIndex ? "2px solid #0a0a0a" : "none",
                  outlineOffset: 1,
                }}
              />
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={quickAdd}
          disabled={adding}
          className="absolute inset-x-3 bottom-3 translate-y-12 cursor-pointer bg-ink py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-white opacity-0 transition-all duration-200 ease-out group-hover:translate-y-0 group-hover:opacity-100 disabled:cursor-wait md:inline-block"
        >
          {adding ? t.authWorking : t.quickAdd}
        </button>
      </div>

      <div className="mt-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-body text-sm font-medium text-ink">
            <Link href={`/product/${product.slug}`}>{l(product.name)}</Link>
          </h3>
          <p className="mt-0.5 text-xs text-ash">{l(color.name)}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end text-sm">
          <span className="font-medium text-ink">{price(product.price)}</span>
          {product.compareAtPrice != null && (
            <span className="text-xs text-ash line-through">
              {price(product.compareAtPrice)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
