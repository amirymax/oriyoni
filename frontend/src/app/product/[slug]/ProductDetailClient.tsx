"use client";

import { useState, type ReactNode } from "react";
import { Badge } from "@/components/Badge";
import { CheckIcon, HeartIcon, MinusIcon, PlusIcon } from "@/components/icons";
import { GarmentMockup } from "@/components/mockups/GarmentMockup";
import { PageHeader } from "@/components/PageHeader";
import { ProductGrid } from "@/components/ProductGrid";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useWishlist } from "@/context/WishlistContext";
import { categoryLabel, sizeLabel } from "@/lib/display";
import type { Product } from "@/lib/products";

export function ProductDetailClient({
  product,
  related,
}: {
  product: Product;
  related: Product[];
}) {
  const [colorIndex, setColorIndex] = useState(0);
  const [size, setSize] = useState(product.sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [openSection, setOpenSection] = useState<"details" | "shipping" | null>(
    "details"
  );

  const { addItem } = useCart();
  const { isSaved, toggle } = useWishlist();
  const { t, l, price } = useLanguage();

  const color = product.colors[colorIndex];
  const saved = isSaved(product.slug);
  const name = l(product.name);
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
        colorId: color.id,
        colorName: color.name,
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
    <>
      <PageHeader title={name} crumb={name} />

      <div className="container-shell py-10 sm:py-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="relative aspect-square w-full bg-card">
            {(product.tags.includes("new") || discount != null) && (
              <div className="absolute left-4 top-4 z-10 flex flex-col gap-1.5">
                {discount != null && <Badge tone="ink">-{discount}%</Badge>}
                {product.tags.includes("new") && (
                  <Badge tone="champagne">{t.badgeNew}</Badge>
                )}
              </div>
            )}
            <GarmentMockup
              garment={product.garment}
              color={color.hex}
              dark={color.dark}
              className="h-full w-full p-16"
            />
          </div>

          <div>
            <p className="eyebrow text-xs text-champagne-ink">
              {categoryLabel(product.category, t)}
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold uppercase tracking-tight text-ink sm:text-4xl">
              {name}
            </h1>

            <div className="mt-4 flex items-center gap-3">
              <span className="text-xl font-medium text-ink">
                {price(product.price)}
              </span>
              {product.compareAtPrice != null && (
                <span className="text-base text-ash line-through">
                  {price(product.compareAtPrice)}
                </span>
              )}
            </div>

            <p className="mt-5 max-w-md text-sm leading-relaxed text-graphite">
              {l(product.description)}
            </p>

            {product.colors.length > 1 && (
              <div className="mt-7">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink">
                  {t.pdpColor} —{" "}
                  <span className="font-normal text-ash">{l(color.name)}</span>
                </p>
                <div className="mt-3 flex gap-2.5">
                  {product.colors.map((c, i) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setColorIndex(i)}
                      aria-label={l(c.name)}
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
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink">
                {t.pdpSize}
              </p>
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
                    {sizeLabel(s, t)}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 flex items-stretch gap-3">
              <div className="flex items-center border border-line">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label={t.qtyDecrease}
                  className="cursor-pointer p-3 text-ink hover:bg-card"
                >
                  <MinusIcon className="h-3.5 w-3.5" />
                </button>
                <span className="w-8 text-center text-sm">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label={t.qtyIncrease}
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
                    <CheckIcon className="h-4 w-4" aria-hidden="true" /> {t.pdpAdded}
                  </>
                ) : (
                  t.pdpAddToCart
                )}
              </button>

              <button
                type="button"
                onClick={() => toggle(product.slug)}
                aria-label={saved ? t.removeFromWishlist : t.addToWishlist}
                aria-pressed={saved}
                className="flex w-12 shrink-0 cursor-pointer items-center justify-center border border-line text-ink hover:border-ink"
              >
                <HeartIcon filled={saved} className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="mt-10 divide-y divide-line border-y border-line">
              <Accordion
                id="details"
                title={t.pdpDetails}
                open={openSection === "details"}
                onToggle={() =>
                  setOpenSection((s) => (s === "details" ? null : "details"))
                }
              >
                <ul className="space-y-1.5">
                  {l(product.details).map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </Accordion>
              <Accordion
                id="shipping"
                title={t.pdpShipping}
                open={openSection === "shipping"}
                onToggle={() =>
                  setOpenSection((s) => (s === "shipping" ? null : "shipping"))
                }
              >
                <p>{t.pdpShippingCopy}</p>
              </Accordion>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="border-t border-line bg-white">
          <div className="container-shell py-16 sm:py-20">
            <h2 className="mb-8 font-display text-2xl font-bold uppercase tracking-tight text-ink">
              {t.pdpRelated}
            </h2>
            <ProductGrid products={related} />
          </div>
        </section>
      )}
    </>
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
  children: ReactNode;
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
        <span aria-hidden="true" className="text-lg leading-none">
          {open ? "–" : "+"}
        </span>
      </button>
      {open && (
        <div id={`${id}-panel`} className="pb-4 text-sm leading-relaxed text-graphite">
          {children}
        </div>
      )}
    </div>
  );
}
