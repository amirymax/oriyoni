import { ShopClient } from "@/app/shop/ShopClient";

export const metadata = {
  title: "Shop All",
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const category = first(params.category);
  const tag = first(params.tag);
  const query = first(params.q);

  return (
    <ShopClient
      key={`${category ?? ""}-${tag ?? ""}-${query ?? ""}`}
      initialCategory={category}
      initialTag={tag}
      initialQuery={query}
    />
  );
}
