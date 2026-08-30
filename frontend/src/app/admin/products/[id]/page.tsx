"use client";

import { use, useEffect, useState } from "react";
import { ProductForm } from "@/app/admin/products/ProductForm";
import { ApiError } from "@/lib/api";
import { getProduct, type ProductDetailAdmin } from "@/lib/admin";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const productId = Number(id);

  const [product, setProduct] = useState<ProductDetailAdmin | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getProduct(productId)
      .then((data) => !cancelled && setProduct(data))
      .catch((caught) => !cancelled && setError(caught instanceof ApiError ? caught.message : "Не удалось загрузить товар."));
    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (error) {
    return <p className="text-sm text-red-700">{error}</p>;
  }

  if (!product) {
    return <p className="text-sm text-graphite">Загрузка…</p>;
  }

  return (
    <div>
      <h1 className="mb-8 font-display text-2xl font-bold uppercase tracking-tight text-ink">
        {product.name_en}
      </h1>
      <ProductForm mode="edit" productId={productId} initial={product} />
    </div>
  );
}
