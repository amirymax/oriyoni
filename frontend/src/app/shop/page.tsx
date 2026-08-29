import { ShopClient } from "@/app/shop/ShopClient";
import { CATEGORY_SLUGS, fetchProducts } from "@/lib/catalog";
import { categories, type Category } from "@/lib/products";

export const metadata = {
  title: "Shop All",
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isCategory(value: string | undefined): value is Category {
  return (categories as readonly string[]).includes(value ?? "");
}

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const params = await searchParams;
  const category = first(params.category);
  const tag = first(params.tag);
  const query = first(params.q);

  // Narrowed server-side so the browser is not sent the whole catalogue only
  // to hide most of it. The client still filters, which keeps the pill
  // buttons instant once the page is up.
  const products = await fetchProducts({
    category: isCategory(category) ? CATEGORY_SLUGS[category] : undefined,
    tag,
    search: query,
  });

  return (
    <ShopClient
      key={`${category ?? ""}-${tag ?? ""}-${query ?? ""}`}
      products={products}
      initialCategory={category}
      initialTag={tag}
      initialQuery={query}
    />
  );
}
