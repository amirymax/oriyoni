"use client";

import Link from "next/link";
import { useEffect } from "react";
import { CloseIcon, MinusIcon, PlusIcon } from "@/components/icons";
import { GarmentMockup } from "@/components/mockups/GarmentMockup";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { sizeLabel } from "@/lib/display";
import { fmt } from "@/lib/i18n";

export function CartDrawer() {
  const { lines, isOpen, closeCart, updateQuantity, removeItem, subtotal } = useCart();
  const { t, l, price } = useLanguage();

  // Escape closes the drawer, matching the scrim and the close button.
  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeCart();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, closeCart]);

  // Hold the page still underneath, so the panel is the only thing moving.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  const itemCount = lines.reduce((n, line) => n + line.quantity, 0);

  return (
    // The drawer stays mounted so the closing slide has something to animate.
    // `inert` keeps the closed panel out of tab order and the accessibility
    // tree, which unmounting used to handle for us.
    <div className="drawer-root" data-open={isOpen} inert={!isOpen}>
      <button
        aria-label={t.cartClose}
        tabIndex={isOpen ? undefined : -1}
        onClick={closeCart}
        className="drawer-scrim cursor-pointer"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.cartTitle}
        className="drawer-panel flex w-full max-w-md flex-col bg-white"
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-ink">
            {fmt(t.cartDrawerTitle, { n: itemCount })}
          </h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label={t.cartClose}
            className="cursor-pointer p-1 text-ink"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 py-16 text-center">
              <p className="text-sm text-ash">{t.cartEmpty}</p>
              <Link
                href="/shop"
                onClick={closeCart}
                className="border border-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-ink"
              >
                {t.cartShopCta}
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {lines.map((line) => (
                <li key={line.key} className="flex gap-4 py-5">
                  <div className="h-24 w-20 shrink-0 bg-card">
                    <GarmentMockup
                      garment={line.garment}
                      color={line.swatchHex}
                      dark={line.swatchDark}
                      className="h-full w-full p-2.5"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-ink">{l(line.name)}</p>
                        <p className="mt-0.5 text-xs text-ash">
                          {l(line.colorName)} · {sizeLabel(line.size, t)}
                        </p>
                      </div>
                      <p className="text-sm text-ink">
                        {price(line.price * line.quantity)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-line">
                        <button
                          type="button"
                          onClick={() => updateQuantity(line.key, line.quantity - 1)}
                          aria-label={t.qtyDecrease}
                          className="cursor-pointer p-1.5 text-ink hover:bg-card"
                        >
                          <MinusIcon className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs">{line.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(line.key, line.quantity + 1)}
                          aria-label={t.qtyIncrease}
                          className="cursor-pointer p-1.5 text-ink hover:bg-card"
                        >
                          <PlusIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(line.key)}
                        className="cursor-pointer text-xs text-ash underline underline-offset-2 hover:text-ink"
                      >
                        {t.cartRemove}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {lines.length > 0 && (
          <div className="border-t border-line px-6 py-5">
            <div className="mb-4 flex items-center justify-between text-sm">
              <span className="text-ash">{t.cartSubtotal}</span>
              <span className="font-medium text-ink">{price(subtotal)}</span>
            </div>
            <Link
              href="/cart"
              onClick={closeCart}
              className="block w-full cursor-pointer bg-ink py-3.5 text-center text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-charcoal"
            >
              {t.cartViewCheckout}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
