import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { ProductGrid } from "@/components/ProductGrid";
import { ProductDetailClient } from "@/app/product/[slug]/ProductDetailClient";
import { getProduct, getRelated, products } from "@/lib/products";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProduct(slug);
  return { title: product ? product.name : "Product" };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProduct(slug);

  if (!product) notFound();

  const related = getRelated(product);

  return (
    <>
      <PageHeader title={product.name} crumb={product.name} />
      <div className="container-shell py-10 sm:py-14">
        <ProductDetailClient product={product} />
      </div>

      {related.length > 0 && (
        <section className="border-t border-line bg-white">
          <div className="container-shell py-16 sm:py-20">
            <h2 className="mb-8 font-display text-2xl font-bold uppercase tracking-tight text-ink">
              You May Also Like
            </h2>
            <ProductGrid products={related} />
          </div>
        </section>
      )}
    </>
  );
}
