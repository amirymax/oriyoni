/**
 * The shape of the catalogue.
 *
 * The products themselves live in Postgres and arrive through the API — see
 * lib/catalog.ts, which adapts the payload into these types. This module is
 * now only the vocabulary the components are written against.
 */

import type { Localized } from "@/lib/i18n";

export type Garment = "tee" | "hoodie" | "cap" | "beanie" | "tote";

export type ProductColor = {
  /** Stable identifier — safe to persist in cart keys across languages. */
  id: string;
  name: Localized;
  hex: string;
  dark: boolean;
};

export type ProductTag = "new" | "sale" | "bestseller";

export type Category = "Tees" | "Hoodies" | "Accessories";

export type Product = {
  slug: string;
  name: Localized;
  category: Category;
  garment: Garment;
  price: number;
  compareAtPrice?: number;
  tags: ProductTag[];
  colors: ProductColor[];
  sizes: string[];
  description: Localized;
  details: Localized<string[]>;
};

export const ONE_SIZE_TOKEN = "One Size";

export const categories = ["Tees", "Hoodies", "Accessories"] as const;
