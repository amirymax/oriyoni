"use client";

import Link from "next/link";
import { CloseIcon, MinusIcon, PlusIcon } from "@/components/icons";
import { GarmentMockup } from "@/components/mockups/GarmentMockup";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";

export function CartDrawer() {
  const { lines, isOpen, closeCart, updateQuantity, removeItem, subtotal } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close cart"
        onClick={closeCart}
        className="absolute inset-0 cursor-pointer bg-ink/40"
      />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-ink">
            Your Bag ({lines.reduce((n, l) => n + l.quantity, 0)})
          </h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className="cursor-pointer p-1 text-ink"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 py-16 text-center">
              <p className="text-sm text-ash">Your bag is empty.</p>
              <Link
                href="/shop"
                onClick={closeCart}
                className="border border-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-ink"
              >
                Shop the collection
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
                        <p className="text-sm font-medium text-ink">{line.name}</p>
                        <p className="mt-0.5 text-xs text-ash">
                          {line.color} · {line.size}
                        </p>
                      </div>
                      <p className="text-sm text-ink">{formatPrice(line.price * line.quantity)}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-line">
                        <button
                          type="button"
                          onClick={() => updateQuantity(line.key, line.quantity - 1)}
                          aria-label="Decrease quantity"
                          className="cursor-pointer p-1.5 text-ink hover:bg-card"
                        >
                          <MinusIcon className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs">{line.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(line.key, line.quantity + 1)}
                          aria-label="Increase quantity"
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
                        Remove
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
              <span className="text-ash">Subtotal</span>
              <span className="font-medium text-ink">{formatPrice(subtotal)}</span>
            </div>
            <Link
              href="/cart"
              onClick={closeCart}
              className="block w-full cursor-pointer bg-ink py-3.5 text-center text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-charcoal"
            >
              View Bag & Checkout
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
