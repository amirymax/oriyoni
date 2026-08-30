"use client";

import { ProductForm } from "@/app/admin/products/ProductForm";

export default function NewProductPage() {
  return (
    <div>
      <h1 className="mb-8 font-display text-2xl font-bold uppercase tracking-tight text-ink">
        Новый товар
      </h1>
      <ProductForm mode="new" />
    </div>
  );
}
