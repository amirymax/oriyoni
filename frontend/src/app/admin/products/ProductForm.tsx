"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState, type FormEvent } from "react";
import { FormError, FormNotice, SubmitButton } from "@/components/form";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { ApiError } from "@/lib/api";
import {
  createProduct,
  deleteProduct,
  listCategories,
  listColors,
  updateProduct,
  type CategoryAdmin,
  type ColorAdmin,
  type Garment,
  type ProductDetailAdmin,
  type ProductTag,
  type ProductWriteBody,
} from "@/lib/admin";

const GARMENTS: Garment[] = ["tee", "hoodie", "cap", "beanie", "tote"];
const TAGS: ProductTag[] = ["new", "sale", "bestseller"];
const GARMENT_LABELS: Record<Garment, string> = {
  tee: "Футболка",
  hoodie: "Худи",
  cap: "Кепка",
  beanie: "Шапка",
  tote: "Сумка",
};
const TAG_LABELS: Record<ProductTag, string> = {
  new: "Новинка",
  sale: "Скидка",
  bestseller: "Хит продаж",
};

type VariantRow = {
  id?: number;
  color: number | "";
  size: string;
  sku: string;
  stock: number;
  is_active: boolean;
};

function toVariantRows(product?: ProductDetailAdmin): VariantRow[] {
  if (!product) return [];
  return product.variants.map((v) => ({
    id: v.id,
    color: typeof v.color === "number" ? v.color : v.color.id,
    size: v.size,
    sku: v.sku,
    stock: v.stock,
    is_active: v.is_active,
  }));
}

export function ProductForm({
  mode,
  productId,
  initial,
}: {
  mode: "new" | "edit";
  productId?: number;
  initial?: ProductDetailAdmin;
}) {
  const router = useRouter();
  const categoryFieldId = useId();
  const garmentFieldId = useId();
  const descriptionEnFieldId = useId();
  const descriptionRuFieldId = useId();

  const [categories, setCategories] = useState<CategoryAdmin[]>([]);
  const [colors, setColors] = useState<ColorAdmin[]>([]);

  const [nameEn, setNameEn] = useState(initial?.name_en ?? "");
  const [nameRu, setNameRu] = useState(initial?.name_ru ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [categoryId, setCategoryId] = useState<string>(
    initial ? String(typeof initial.category === "number" ? initial.category : initial.category.id) : ""
  );
  const [garment, setGarment] = useState<Garment>(initial?.garment ?? "tee");
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [compareAtPrice, setCompareAtPrice] = useState(
    initial?.compare_at_price != null ? String(initial.compare_at_price) : ""
  );
  const [tags, setTags] = useState<ProductTag[]>(initial?.tags ?? []);
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [position, setPosition] = useState(initial ? String(initial.position) : "0");
  const [descriptionEn, setDescriptionEn] = useState(initial?.description_en ?? "");
  const [descriptionRu, setDescriptionRu] = useState(initial?.description_ru ?? "");
  const [detailsEn, setDetailsEn] = useState<string[]>(initial?.details_en ?? []);
  const [detailsRu, setDetailsRu] = useState<string[]>(initial?.details_ru ?? []);
  const [variants, setVariants] = useState<VariantRow[]>(toVariantRows(initial));
  const [images, setImages] = useState(initial?.images ?? []);

  const [error, setError] = useState<ApiError | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    listCategories({ page: 1 })
      .then((data) => setCategories(data.results))
      .catch(() => setCategories([]));
    listColors({ page: 1 })
      .then((data) => setColors(data.results))
      .catch(() => setColors([]));
  }, []);

  const colorOptionsForImages = useMemo(() => {
    const usedIds = new Set(variants.map((v) => v.color).filter((c): c is number => c !== ""));
    return colors.filter((c) => usedIds.has(c.id)).map((c) => ({ id: c.id, name_en: c.name_en }));
  }, [variants, colors]);

  function toggleTag(tag: ProductTag) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  function updateVariant(index: number, patch: Partial<VariantRow>) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  function addVariant() {
    setVariants((prev) => [
      ...prev,
      { color: colors[0]?.id ?? "", size: "", sku: "", stock: 0, is_active: true },
    ]);
  }

  function removeVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  function updateDetailLine(list: string[], setList: (v: string[]) => void, index: number, value: string) {
    setList(list.map((line, i) => (i === index ? value : line)));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setNotice(null);

    const body: ProductWriteBody = {
      slug,
      name_en: nameEn,
      name_ru: nameRu,
      category: Number(categoryId),
      garment,
      price: Number(price),
      compare_at_price: compareAtPrice === "" ? null : Number(compareAtPrice),
      tags,
      is_active: isActive,
      position: Number(position),
      description_en: descriptionEn,
      description_ru: descriptionRu,
      details_en: detailsEn.filter((line) => line.trim() !== ""),
      details_ru: detailsRu.filter((line) => line.trim() !== ""),
      variants: variants
        .filter((v) => v.color !== "")
        .map((v) => ({
          id: v.id,
          color: v.color as number,
          size: v.size,
          sku: v.sku,
          stock: v.stock,
          is_active: v.is_active,
        })),
    };

    try {
      if (mode === "new") {
        const created = await createProduct(body);
        router.push(`/admin/products/${created.id}`);
      } else if (productId) {
        await updateProduct(productId, body);
        setNotice("Товар сохранён.");
      }
    } catch (caught) {
      setError(caught instanceof ApiError ? caught : new ApiError(0, "Не удалось сохранить товар."));
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!productId) return;
    if (!window.confirm("Удалить этот товар? Это также удалит все его варианты. Если у товара есть история продаж, рекомендуется скрыть его (снять галочку «Активен»), а не удалять.")) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await deleteProduct(productId);
      router.push("/admin/products");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught : new ApiError(0, "Не удалось удалить товар."));
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10" noValidate>
      <FormError>{error?.banner}</FormError>
      {notice ? <FormNotice>{notice}</FormNotice> : null}

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextField label="Название (EN)" value={nameEn} onChange={setNameEn} error={error?.field("name_en")} required />
        <TextField label="Название (RU)" value={nameRu} onChange={setNameRu} error={error?.field("name_ru")} required />
        <TextField label="Slug" value={slug} onChange={setSlug} error={error?.field("slug")} required />
        <div>
          <FieldLabel htmlFor={categoryFieldId}>Категория</FieldLabel>
          <select
            id={categoryFieldId}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            className="w-full border border-line px-3.5 py-3 text-sm text-ink focus:border-ink focus:outline-none"
          >
            <option value="" disabled>
              Выберите категорию
            </option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name_en}
              </option>
            ))}
          </select>
          {error?.field("category") ? <p className="mt-1.5 text-xs text-red-700">{error.field("category")}</p> : null}
        </div>
        <div>
          <FieldLabel htmlFor={garmentFieldId}>Тип</FieldLabel>
          <select
            id={garmentFieldId}
            value={garment}
            onChange={(e) => setGarment(e.target.value as Garment)}
            className="w-full border border-line px-3.5 py-3 text-sm text-ink focus:border-ink focus:outline-none"
          >
            {GARMENTS.map((g) => (
              <option key={g} value={g}>
                {GARMENT_LABELS[g]}
              </option>
            ))}
          </select>
        </div>
        <TextField
          label="Цена, ₽"
          type="number"
          value={price}
          onChange={setPrice}
          error={error?.field("price")}
          required
        />
        <TextField
          label="Цена до скидки, ₽"
          type="number"
          value={compareAtPrice}
          onChange={setCompareAtPrice}
          error={error?.field("compare_at_price")}
        />
        <TextField label="Позиция" type="number" value={position} onChange={setPosition} />
        <div className="flex items-center gap-2 pt-7">
          <input
            id="is_active"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4"
          />
          <label htmlFor="is_active" className="text-xs font-semibold uppercase tracking-[0.08em] text-ink">
            Активен (виден в магазине)
          </label>
        </div>
      </section>

      <section>
        <FieldLabel>Теги</FieldLabel>
        <div className="flex flex-wrap gap-4">
          {TAGS.map((tag) => (
            <label key={tag} className="flex items-center gap-2 text-xs uppercase tracking-[0.08em] text-ink">
              <input
                type="checkbox"
                checked={tags.includes(tag)}
                onChange={() => toggleTag(tag)}
                className="h-4 w-4"
              />
              {TAG_LABELS[tag]}
            </label>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor={descriptionEnFieldId}>Описание (EN)</FieldLabel>
          <textarea
            id={descriptionEnFieldId}
            value={descriptionEn}
            onChange={(e) => setDescriptionEn(e.target.value)}
            rows={5}
            className="w-full border border-line px-3.5 py-3 text-sm text-ink focus:border-ink focus:outline-none"
          />
        </div>
        <div>
          <FieldLabel htmlFor={descriptionRuFieldId}>Описание (RU)</FieldLabel>
          <textarea
            id={descriptionRuFieldId}
            value={descriptionRu}
            onChange={(e) => setDescriptionRu(e.target.value)}
            rows={5}
            className="w-full border border-line px-3.5 py-3 text-sm text-ink focus:border-ink focus:outline-none"
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <DetailLines
          label="Характеристики (EN)"
          lines={detailsEn}
          onChange={setDetailsEn}
          onLineChange={(i, v) => updateDetailLine(detailsEn, setDetailsEn, i, v)}
        />
        <DetailLines
          label="Характеристики (RU)"
          lines={detailsRu}
          onChange={setDetailsRu}
          onLineChange={(i, v) => updateDetailLine(detailsRu, setDetailsRu, i, v)}
        />
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-ink">Варианты</h2>
          <button
            type="button"
            onClick={addVariant}
            className="cursor-pointer border border-ink px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-ink hover:bg-card"
          >
            Добавить вариант
          </button>
        </div>
        {variants.length === 0 ? (
          <p className="text-xs text-ash">Вариантов пока нет — добавьте хотя бы один перед сохранением.</p>
        ) : (
          <div className="overflow-x-auto border border-line">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line bg-card text-xs font-semibold uppercase tracking-[0.08em] text-graphite">
                  <th className="px-3 py-2 text-left">Цвет</th>
                  <th className="px-3 py-2 text-left">Размер</th>
                  <th className="px-3 py-2 text-left">Артикул</th>
                  <th className="px-3 py-2 text-left">Остаток</th>
                  <th className="px-3 py-2 text-left">Активен</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {variants.map((variant, index) => (
                  <tr key={variant.id ?? `new-${index}`} className="border-b border-line last:border-b-0">
                    <td className="px-3 py-2">
                      <select
                        value={variant.color}
                        onChange={(e) => updateVariant(index, { color: e.target.value ? Number(e.target.value) : "" })}
                        className="border border-line px-2 py-1.5 text-xs"
                      >
                        <option value="">Выберите…</option>
                        {colors.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name_en}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={variant.size}
                        onChange={(e) => updateVariant(index, { size: e.target.value })}
                        className="w-20 border border-line px-2 py-1.5 text-xs"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={variant.sku}
                        onChange={(e) => updateVariant(index, { sku: e.target.value })}
                        className="w-32 border border-line px-2 py-1.5 text-xs"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={variant.stock}
                        onChange={(e) => updateVariant(index, { stock: Number(e.target.value) })}
                        className="w-20 border border-line px-2 py-1.5 text-xs"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={variant.is_active}
                        onChange={(e) => updateVariant(index, { is_active: e.target.checked })}
                        className="h-4 w-4"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="cursor-pointer text-xs text-red-700 underline underline-offset-2"
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {error?.field("variants") ? <p className="mt-1.5 text-xs text-red-700">{error.field("variants")}</p> : null}
      </section>

      {mode === "edit" && productId ? (
        <section>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.1em] text-ink">Фото</h2>
          <ImageUploader
            productId={productId}
            images={images}
            onChange={setImages}
            colorOptions={colorOptionsForImages}
          />
        </section>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
        <div className="max-w-xs">
          <SubmitButton pending={pending} pendingLabel="Сохранение…">
            {mode === "new" ? "Создать товар" : "Сохранить изменения"}
          </SubmitButton>
        </div>
        {mode === "edit" ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="cursor-pointer text-xs font-semibold uppercase tracking-[0.1em] text-red-700 underline underline-offset-4 disabled:opacity-50"
          >
            {deleting ? "Удаление…" : "Удалить товар"}
          </button>
        ) : null}
      </div>
    </form>
  );
}

function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-ink">
      {children}
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  error,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  required?: boolean;
}) {
  const id = useId();
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        step={type === "number" ? "0.01" : undefined}
        className={`w-full border px-3.5 py-3 text-sm text-ink focus:outline-none ${
          error ? "border-red-700 focus:border-red-700" : "border-line focus:border-ink"
        }`}
      />
      {error ? <p className="mt-1.5 text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

function DetailLines({
  label,
  lines,
  onChange,
  onLineChange,
}: {
  label: string;
  lines: string[];
  onChange: (lines: string[]) => void;
  onLineChange: (index: number, value: string) => void;
}) {
  return (
    <div role="group" aria-label={label}>
      <FieldLabel>{label}</FieldLabel>
      <div className="space-y-2">
        {lines.map((line, index) => (
          <div key={index} className="flex gap-2">
            <input
              value={line}
              onChange={(e) => onLineChange(index, e.target.value)}
              className="flex-1 border border-line px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
            />
            <button
              type="button"
              onClick={() => onChange(lines.filter((_, i) => i !== index))}
              className="cursor-pointer px-2 text-xs text-red-700"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...lines, ""])}
          className="cursor-pointer border border-line px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-ink hover:bg-card"
        >
          Добавить строку
        </button>
      </div>
    </div>
  );
}
