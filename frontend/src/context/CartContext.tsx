"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { api, mediaUrl, type Cart as ApiCart, type CartLine as ApiCartLine } from "@/lib/api";
import type { Localized } from "@/lib/i18n";
import type { Garment, ProductPhoto } from "@/lib/products";

/**
 * The cart lives on the server.
 *
 * It used to be localStorage, which meant it was per-browser and could not be
 * checked against stock. Now every change is a call, and the response is the
 * whole cart — so the UI never has to guess what the total became.
 *
 * The line shape is unchanged from the localStorage version so that the
 * drawer and the cart page did not have to be rewritten around it.
 */
export type CartLine = {
  /** The server's line id. Stable for as long as the line exists. */
  key: string;
  slug: string;
  name: Localized;
  price: number;
  colorId: string;
  colorName: Localized;
  size: string;
  garment: Garment;
  swatchHex: string;
  swatchDark: boolean;
  /** The product's photo for this colourway; null draws the mockup instead. */
  photo: ProductPhoto | null;
  quantity: number;
  /** How many of this variant the shop still has. */
  available: number;
};

type CartContextValue = {
  lines: CartLine[];
  isOpen: boolean;
  count: number;
  subtotal: number;
  loading: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (sku: string, quantity?: number) => Promise<void>;
  updateQuantity: (key: string, quantity: number) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refresh: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

function toLine(line: ApiCartLine): CartLine {
  return {
    key: String(line.id),
    slug: line.product_slug,
    name: line.name,
    price: line.unit_price,
    colorId: line.color.slug,
    colorName: line.color.name,
    size: line.size,
    garment: line.garment as Garment,
    swatchHex: line.color.hex,
    swatchDark: line.color.is_dark,
    photo: line.image
      ? { url: mediaUrl(line.image), colorId: line.color.slug, alt: "" }
      : null,
    quantity: line.quantity,
    available: line.available,
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<ApiCart>({ items: [], count: 0, subtotal: 0 });
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { status } = useAuth();

  const refresh = useCallback(async () => {
    try {
      setCart(await api<ApiCart>("/api/cart/"));
    } catch {
      // An unreachable API leaves the badge at zero rather than breaking the
      // page around it; the next change will report the real error.
    } finally {
      setLoading(false);
    }
  }, []);

  // Reloaded whenever the session changes, because signing in merges the
  // guest cart into the account's and the totals move.
  useEffect(() => {
    if (status === "loading") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refresh only sets state after awaiting the API, so no render cascades
    void refresh();
  }, [status, refresh]);

  const addItem = useCallback(async (sku: string, quantity = 1) => {
    setCart(await api<ApiCart>("/api/cart/items/", { method: "POST", body: { sku, quantity } }));
    setIsOpen(true);
  }, []);

  const updateQuantity = useCallback(async (key: string, quantity: number) => {
    // Zero removes the line; the API treats it that way so the stepper does
    // not need a separate call for its last decrement.
    setCart(
      await api<ApiCart>(`/api/cart/items/${key}/`, { method: "PATCH", body: { quantity } })
    );
  }, []);

  const removeItem = useCallback(async (key: string) => {
    setCart(await api<ApiCart>(`/api/cart/items/${key}/`, { method: "DELETE" }));
  }, []);

  const clearCart = useCallback(async () => {
    setCart(await api<ApiCart>("/api/cart/", { method: "DELETE" }));
  }, []);

  const lines = useMemo(() => cart.items.map(toLine), [cart.items]);

  const value = useMemo(
    () => ({
      lines,
      isOpen,
      count: cart.count,
      subtotal: cart.subtotal,
      loading,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      refresh,
    }),
    [lines, isOpen, cart.count, cart.subtotal, loading, addItem, updateQuantity, removeItem, clearCart, refresh]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
