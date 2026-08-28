"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/Badge";
import { GarmentMockup } from "@/components/mockups/GarmentMockup";
import { HeartIcon } from "@/components/icons";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  const [colorIndex, setColorIndex] = useState(0);
  const { addItem } = useCart();
  const { isSaved, toggle } = useWishlist();
  const color = product.colors[colorIndex];
  const saved = isSaved(product.slug);
  const discount =
    product.compareAtPrice != null
      ? Math.round(100 - (product.price / product.compareAtPrice) * 100)
      : null;

  return (
    <div className="group relative flex flex-col">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-card">
        <Link href={`/product/${product.slug}`} className="block h-full w-full">
          <GarmentMockup
            garment={product.garment}
            color={color.hex}
            dark={color.dark}
            className="h-full w-full p-8 transition-transform duration-300 ease-out group-hover:scale-[1.04]"
          />
        </Link>

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {discount != null && <Badge tone="ink">-{discount}%</Badge>}
          {product.tags.includes("new") && <Badge tone="champagne">New</Badge>}
          {product.tags.includes("bestseller") && (
            <Badge tone="outline" className="bg-white/90">
              Bestseller
            </Badge>
          )}
        </div>

        <button
          type="button"
          onClick={() => toggle(product.slug)}
          aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={saved}
          className="absolute right-3 top-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/90 text-ink transition-colors hover:bg-white"
        >
          <HeartIcon filled={saved} className="h-4.5 w-4.5" />
        </button>

        {product.colors.length > 1 && (
          <div className="absolute bottom-3 left-3 flex gap-1.5">
            {product.colors.map((c, i) => (
              <button
                key={c.name}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setColorIndex(i);
                }}
                aria-label={`View ${c.name}`}
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
          onClick={() =>
            addItem({
              slug: product.slug,
              name: product.name,
              price: product.price,
              color: color.name,
              size: product.sizes[0],
              garment: product.garment,
              swatchHex: color.hex,
              swatchDark: color.dark,
            })
          }
          className="absolute inset-x-3 bottom-3 translate-y-12 cursor-pointer bg-ink py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-white opacity-0 transition-all duration-200 ease-out group-hover:translate-y-0 group-hover:opacity-100 md:inline-block"
        >
          Quick Add
        </button>
      </div>

      <div className="mt-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-body text-sm font-medium text-ink">
            <Link href={`/product/${product.slug}`}>{product.name}</Link>
          </h3>
          <p className="mt-0.5 text-xs text-ash">{color.name}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end text-sm">
          <span className="font-medium text-ink">{formatPrice(product.price)}</span>
          {product.compareAtPrice != null && (
            <span className="text-xs text-ash line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
