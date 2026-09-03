/**
 * Reading the catalogue from the API.
 *
 * The API's field names follow Django (snake_case, category slugs); the
 * storefront's components were written against the shape in lib/products.ts.
 * Rather than rename props across a dozen components, the payload is adapted
 * here into the shape they already expect — so the only thing that changed
 * about the catalogue is where it comes from.
 */

import {
  API_URL,
  type ApiProduct,
  type ApiProductDetail,
  type ApiProductImage,
  type ApiVariant,
  type Paginated,
} from "@/lib/api";
import type {
  Category,
  Garment,
  Product,
  ProductColor,
  ProductPhoto,
  ProductTag,
} from "@/lib/products";

const CATEGORY_BY_SLUG: Record<string, Category> = {
  tees: "Tees",
  hoodies: "Hoodies",
  accessories: "Accessories",
};

export const CATEGORY_SLUGS: Record<Category, string> = {
  Tees: "tees",
  Hoodies: "hoodies",
  Accessories: "accessories",
};

/** A product plus the SKUs the cart needs to add a specific colour and size. */
export type ProductWithVariants = Product & { variants: ApiVariant[] };

function toColor(color: ApiProduct["colors"][number]): ProductColor {
  return {
    id: color.slug,
    name: color.name,
    hex: color.hex,
    dark: color.is_dark,
  };
}

function toPhoto(image: ApiProductImage): ProductPhoto {
  return {
    // DRF returns an absolute URL when it can see the request, and a bare
    // `/media/…` path when it cannot — an `<img>` needs the host either way.
    url: image.image.startsWith("http") ? image.image : `${API_URL}${image.image}`,
    colorId: image.color,
    alt: image.alt_text,
  };
}

export function toProduct(payload: ApiProduct): Product {
  return {
    slug: payload.slug,
    name: payload.name,
    category: CATEGORY_BY_SLUG[payload.category] ?? "Accessories",
    garment: payload.garment as Garment,
    price: payload.price,
    compareAtPrice: payload.compare_at_price ?? undefined,
    tags: payload.tags as ProductTag[],
    colors: payload.colors.map(toColor),
    sizes: payload.sizes,
    photos: (payload.images ?? []).map(toPhoto),
    description: payload.description,
    // Only the detail endpoint carries these; a card never shows them.
    details: (payload as ApiProductDetail).details ?? { en: [], ru: [] },
  };
}

async function get<T>(path: string): Promise<T> {
  // fetch is uncached in this version of Next, so the storefront always shows
  // the catalogue as it stands rather than as it was at build time.
  const response = await fetch(`${API_URL}${path}`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Catalogue request failed: ${path} returned ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function fetchProducts(
  params: Record<string, string | undefined> = {}
): Promise<Product[]> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }

  const suffix = query.toString() ? `?${query}` : "";
  const page = await get<Paginated<ApiProduct>>(`/api/products/${suffix}`);
  return page.results.map(toProduct);
}

export async function fetchProduct(slug: string): Promise<ProductWithVariants | null> {
  try {
    const payload = await get<ApiProductDetail>(
      `/api/products/${encodeURIComponent(slug)}/`
    );
    return { ...toProduct(payload), variants: payload.variants };
  } catch {
    // A slug that is not in the catalogue, or has been withdrawn, is a 404
    // for the page rather than an error worth showing.
    return null;
  }
}

/**
 * Other pieces to show under a product.
 *
 * Same category first, then anything else, which is what the hardcoded
 * version did — near neighbours read as a considered suggestion.
 */
export async function fetchRelated(product: Product, count = 4): Promise<Product[]> {
  const [sameCategory, everything] = await Promise.all([
    fetchProducts({ category: CATEGORY_SLUGS[product.category] }),
    fetchProducts(),
  ]);

  const seen = new Set([product.slug]);
  const related: Product[] = [];

  for (const candidate of [...sameCategory, ...everything]) {
    if (seen.has(candidate.slug)) continue;
    seen.add(candidate.slug);
    related.push(candidate);
    if (related.length === count) break;
  }

  return related;
}
