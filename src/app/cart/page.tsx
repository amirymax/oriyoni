"use client";

import Link from "next/link";
import { useState } from "react";
import { MinusIcon, PlusIcon } from "@/components/icons";
import { GarmentMockup } from "@/components/mockups/GarmentMockup";
import { PageHeader } from "@/components/PageHeader";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const { lines, updateQuantity, removeItem, subtotal } = useCart();
  const [promo, setPromo] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);

  const shipping = lines.length === 0 || subtotal >= 120 ? 0 : 8;
  const discount = promoApplied ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal + shipping - discount;

  return (
    <>
      <PageHeader title="Your Bag" />
      <div className="container-shell py-10 sm:py-14">
        {lines.length === 0 ? (
          <div className="flex flex-col items-center gap-5 py-20 text-center">
            <p className="text-sm text-ash">Your bag is empty.</p>
            <Link
              href="/shop"
              className="cursor-pointer bg-ink px-7 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white"
            >
              Shop the Collection
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_360px]">
            <ul className="divide-y divide-line border-y border-line">
              {lines.map((line) => (
                <li key={line.key} className="flex gap-5 py-6">
                  <div className="h-28 w-24 shrink-0 bg-card">
                    <GarmentMockup
                      garment={line.garment}
                      color={line.swatchHex}
                      dark={line.swatchDark}
                      className="h-full w-full p-3"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex justify-between gap-3">
                      <div>
                        <Link
                          href={`/product/${line.slug}`}
                          className="text-sm font-medium text-ink hover:text-graphite"
                        >
                          {line.name}
                        </Link>
                        <p className="mt-1 text-xs text-ash">
                          {line.color} · {line.size}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-ink">
                        {formatPrice(line.price * line.quantity)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-line">
                        <button
                          type="button"
                          onClick={() => updateQuantity(line.key, line.quantity - 1)}
                          aria-label="Decrease quantity"
                          className="cursor-pointer p-2 text-ink hover:bg-card"
                        >
                          <MinusIcon className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs">{line.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(line.key, line.quantity + 1)}
                          aria-label="Increase quantity"
                          className="cursor-pointer p-2 text-ink hover:bg-card"
                        >
                          <PlusIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(line.key)}
                        className="cursor-pointer text-xs text-ash underline underline-offset-2 hover:text-ink"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="h-fit border border-line p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-ink">
                Order Summary
              </h2>

              <div className="mt-5 flex gap-2">
                <label htmlFor="promo" className="sr-only">
                  Promo code
                </label>
                <input
                  id="promo"
                  type="text"
                  value={promo}
                  onChange={(e) => setPromo(e.target.value)}
                  placeholder="Promo code"
                  className="w-full border border-line px-3 py-2.5 text-sm placeholder:text-ash focus:border-ink focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setPromoApplied(promo.trim().toUpperCase() === "CROWN10")}
                  className="shrink-0 cursor-pointer border border-ink px-4 text-xs font-semibold uppercase tracking-[0.06em] text-ink hover:bg-ink hover:text-white"
                >
                  Apply
                </button>
              </div>
              {promo && !promoApplied && (
                <p className="mt-2 text-xs text-ash">Try code CROWN10 for 10% off.</p>
              )}
              {promoApplied && (
                <p className="mt-2 text-xs text-champagne-ink">CROWN10 applied — 10% off.</p>
              )}

              <div className="mt-6 space-y-3 border-t border-line pt-6 text-sm">
                <div className="flex justify-between text-graphite">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-graphite">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
                </div>
                {promoApplied && (
                  <div className="flex justify-between text-champagne-ink">
                    <span>Discount</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-line pt-3 text-base font-medium text-ink">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <button
                type="button"
                title="Checkout will be enabled once payments are connected"
                className="mt-6 w-full cursor-not-allowed bg-ink/40 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-white"
                disabled
              >
                Proceed to Checkout
              </button>
              <p className="mt-3 text-center text-[11px] text-ash">
                Checkout opens once payments are connected.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
