"use client";

import { useState } from "react";
import { Badge } from "@/components/Badge";
import { CheckIcon, HeartIcon, MinusIcon, PlusIcon } from "@/components/icons";
import { GarmentMockup } from "@/components/mockups/GarmentMockup";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/products";

export function ProductDetailClient({ product }: { product: Product }) {
  const [colorIndex, setColorIndex] = useState(0);
  const [size, setSize] = useState(product.sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [openSection, setOpenSection] = useState<"details" | "shipping" | null>(
    "details"
  );

  const { addItem } = useCart();
  const { isSaved, toggle } = useWishlist();

  const color = product.colors[colorIndex];
  const saved = isSaved(product.slug);
  const discount =
    product.compareAtPrice != null
      ? Math.round(100 - (product.price / product.compareAtPrice) * 100)
      : null;

  function handleAddToCart() {
    addItem(
      {
        slug: product.slug,
        name: product.name,
        price: product.price,
        color: color.name,
        size,
        garment: product.garment,
        swatchHex: color.hex,
        swatchDark: color.dark,
      },
      quantity
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
      <div>
        <div className="relative aspect-square w-full bg-card">
          {(product.tags.includes("new") || discount != null) && (
            <div className="absolute left-4 top-4 z-10 flex flex-col gap-1.5">
              {discount != null && <Badge tone="ink">-{discount}%</Badge>}
              {product.tags.includes("new") && <Badge tone="champagne">New</Badge>}
            </div>
          )}
          <GarmentMockup
            garment={product.garment}
            color={color.hex}
            dark={color.dark}
            className="h-full w-full p-16"
          />
        </div>
      </div>

      <div>
        <p className="eyebrow text-xs text-champagne-ink">{product.category}</p>
        <h1 className="mt-2 font-display text-3xl font-bold uppercase tracking-tight text-ink sm:text-4xl">
          {product.name}
        </h1>

        <div className="mt-4 flex items-center gap-3">
          <span className="text-xl font-medium text-ink">
            {formatPrice(product.price)}
          </span>
          {product.compareAtPrice != null && (
            <span className="text-base text-ash line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>

        <p className="mt-5 max-w-md text-sm leading-relaxed text-graphite">
          {product.description}
        </p>

        {product.colors.length > 1 && (
          <div className="mt-7">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink">
              Color — <span className="font-normal text-ash">{color.name}</span>
            </p>
            <div className="mt-3 flex gap-2.5">
              {product.colors.map((c, i) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setColorIndex(i)}
                  aria-label={c.name}
                  aria-pressed={i === colorIndex}
                  className="h-9 w-9 cursor-pointer rounded-full border-2 transition-colors"
                  style={{
                    backgroundColor: c.hex,
                    borderColor: i === colorIndex ? "#0a0a0a" : "transparent",
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div className="mt-7">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink">Size</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                aria-pressed={size === s}
                className={`cursor-pointer border px-4 py-2 text-xs font-medium uppercase tracking-[0.04em] transition-colors ${
                  size === s
                    ? "border-ink bg-ink text-white"
                    : "border-line text-ink hover:border-ink"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 flex items-stretch gap-3">
          <div className="flex items-center border border-line">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
              className="cursor-pointer p-3 text-ink hover:bg-card"
            >
              <MinusIcon className="h-3.5 w-3.5" />
            </button>
            <span className="w-8 text-center text-sm">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              aria-label="Increase quantity"
              className="cursor-pointer p-3 text-ink hover:bg-card"
            >
              <PlusIcon className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 bg-ink py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-charcoal"
          >
            {added ? (
              <>
                <CheckIcon className="h-4 w-4" /> Added
              </>
            ) : (
              "Add to Cart"
            )}
          </button>

          <button
            type="button"
            onClick={() => toggle(product.slug)}
            aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={saved}
            className="flex w-12 shrink-0 cursor-pointer items-center justify-center border border-line text-ink hover:border-ink"
          >
            <HeartIcon filled={saved} className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="mt-10 divide-y divide-line border-y border-line">
          <Accordion
            id="details"
            title="Details & Care"
            open={openSection === "details"}
            onToggle={() =>
              setOpenSection((s) => (s === "details" ? null : "details"))
            }
          >
            <ul className="space-y-1.5">
              {product.details.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </Accordion>
          <Accordion
            id="shipping"
            title="Shipping & Returns"
            open={openSection === "shipping"}
            onToggle={() =>
              setOpenSection((s) => (s === "shipping" ? null : "shipping"))
            }
          >
            <p>
              Free shipping on orders over $120. Delivered in 3–5 business days.
              Not the right fit? Return it within 30 days for a full refund.
            </p>
          </Accordion>
        </div>
      </div>
    </div>
  );
}

function Accordion({
  title,
  open,
  onToggle,
  children,
  id,
}: {
  id: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        className="flex w-full cursor-pointer items-center justify-between py-4 text-left text-sm font-semibold uppercase tracking-[0.04em] text-ink"
      >
        {title}
        <span className="text-lg leading-none">{open ? "–" : "+"}</span>
      </button>
      {open && (
        <div id={`${id}-panel`} className="pb-4 text-sm leading-relaxed text-graphite">
          {children}
        </div>
      )}
    </div>
  );
}
