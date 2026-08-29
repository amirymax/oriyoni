import { notFound } from "next/navigation";
import { ProductDetailClient } from "@/app/product/[slug]/ProductDetailClient";
import { fetchProduct, fetchRelated } from "@/lib/catalog";

// No generateStaticParams: the catalogue is editable from the admin, so
// pre-rendering a fixed set of slugs at build time would go stale the first
// time someone adds a product.

export async function generateMetadata({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const product = await fetchProduct(slug);
  return { title: product ? product.name.en : "Product" };
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  if (!product) notFound();

  return (
    <ProductDetailClient product={product} related={await fetchRelated(product)} />
  );
}
