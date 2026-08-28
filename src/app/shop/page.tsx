import { PageHeader } from "@/components/PageHeader";
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
    <>
      <PageHeader
        title="Shop All"
        description="Heavyweight tees, hoodies, and the accessories built to go with them."
      />
      <div className="container-shell py-10 sm:py-14">
        <ShopClient
          key={`${category ?? ""}-${tag ?? ""}-${query ?? ""}`}
          initialCategory={category}
          initialTag={tag}
          initialQuery={query}
        />
      </div>
    </>
  );
}
