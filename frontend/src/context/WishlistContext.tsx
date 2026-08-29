"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { api, type ApiProduct } from "@/lib/api";

/**
 * Saved products.
 *
 * Signed in, the list lives on the account and follows the shopper between
 * devices. Signed out it stays in localStorage, because a guest has nothing
 * to attach it to — and on the first sign-in the local list is pushed up and
 * merged, so nothing is lost by making an account late.
 */
type WishlistContextValue = {
  slugs: string[];
  count: number;
  isSaved: (slug: string) => boolean;
  toggle: (slug: string) => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);
const STORAGE_KEY = "oriyoni-wishlist-v1";

function readLocal(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(slugs: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  } catch {
    // A browser refusing storage is not worth breaking the heart button over.
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  const { status } = useAuth();
  const merged = useRef(false);

  useEffect(() => {
    if (status === "loading") return;

    let cancelled = false;

    async function load() {
      if (status === "guest") {
        merged.current = false;
        setSlugs(readLocal());
        return;
      }

      const local = readLocal();
      // Push whatever this browser was holding up to the account once per
      // sign-in, then take the account's list as the truth.
      const saved = merged.current
        ? await api<ApiProduct[]>("/api/wishlist/")
        : await api<ApiProduct[]>("/api/wishlist/sync/", {
            method: "POST",
            body: { slugs: local },
          });

      if (cancelled) return;
      merged.current = true;
      setSlugs(saved.map((product) => product.slug));
      // Cleared so that signing out on a shared machine does not leave the
      // previous shopper's saves behind.
      writeLocal([]);
    }

    load().catch(() => {
      if (!cancelled) setSlugs(readLocal());
    });

    return () => {
      cancelled = true;
    };
  }, [status]);

  const toggle = useCallback(
    (slug: string) => {
      const saved = slugs.includes(slug);
      const next = saved ? slugs.filter((s) => s !== slug) : [...slugs, slug];

      // Optimistic: the heart should fill the moment it is pressed.
      setSlugs(next);

      if (status !== "authenticated") {
        writeLocal(next);
        return;
      }

      const request = saved
        ? api(`/api/wishlist/${slug}/`, { method: "DELETE" })
        : api("/api/wishlist/", { method: "POST", body: { slug } });

      request.catch(() => setSlugs(slugs));
    },
    [slugs, status]
  );

  const isSaved = useCallback((slug: string) => slugs.includes(slug), [slugs]);

  const value = useMemo(
    () => ({ slugs, count: slugs.length, isSaved, toggle }),
    [slugs, isSaved, toggle]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
