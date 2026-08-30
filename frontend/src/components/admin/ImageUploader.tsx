"use client";

import { useState } from "react";
import { FormError } from "@/components/form";
import { ApiError, API_URL } from "@/lib/api";
import {
  deleteProductImage,
  updateProductImage,
  uploadProductImage,
  type ProductImageAdmin,
} from "@/lib/admin";

/**
 * Photo management for one product: upload, reorder (simple up/down instead
 * of drag-to-reorder — fewer moving parts for an admin-only tool), delete,
 * and optionally tag a photo to one of the product's colorways.
 *
 * Uploaded images are served from wherever `NEXT_PUBLIC_API_URL` points,
 * which is only known at runtime — so this uses a plain `<img>` rather than
 * `next/image`, which would need the host allow-listed in `next.config.ts`
 * ahead of time.
 */
export function ImageUploader({
  productId,
  images,
  onChange,
  colorOptions,
}: {
  productId: number;
  images: ProductImageAdmin[];
  onChange: (images: ProductImageAdmin[]) => void;
  colorOptions: { id: number; name_en: string }[];
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);

  const sorted = [...images].sort((a, b) => a.position - b.position);

  function imageSrc(path: string) {
    return path.startsWith("http") ? path : `${API_URL}${path}`;
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded = await uploadProductImage({
        product: productId,
        image: files[0],
        position: images.length,
      });
      onChange([...images, uploaded]);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Не удалось загрузить файл.");
    } finally {
      setUploading(false);
    }
  }

  async function handleMove(image: ProductImageAdmin, direction: -1 | 1) {
    const idx = sorted.findIndex((item) => item.id === image.id);
    const swapWith = sorted[idx + direction];
    if (!swapWith) return;

    setPendingId(image.id);
    setError(null);
    try {
      const [updatedA, updatedB] = await Promise.all([
        updateProductImage(image.id, { position: swapWith.position }),
        updateProductImage(swapWith.id, { position: image.position }),
      ]);
      onChange(
        images.map((item) => {
          if (item.id === updatedA.id) return updatedA;
          if (item.id === updatedB.id) return updatedB;
          return item;
        })
      );
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Не удалось изменить порядок.");
    } finally {
      setPendingId(null);
    }
  }

  async function handleColorChange(image: ProductImageAdmin, color: number | null) {
    setPendingId(image.id);
    setError(null);
    try {
      const updated = await updateProductImage(image.id, { color });
      onChange(images.map((item) => (item.id === updated.id ? updated : item)));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Не удалось обновить.");
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(image: ProductImageAdmin) {
    if (!window.confirm("Удалить это изображение? Это действие нельзя отменить.")) return;
    setPendingId(image.id);
    setError(null);
    try {
      await deleteProductImage(image.id);
      onChange(images.filter((item) => item.id !== image.id));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Не удалось удалить.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div>
      <FormError>{error}</FormError>

      {sorted.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {sorted.map((image, idx) => (
            <div key={image.id} className="border border-line p-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- host is only known at runtime */}
              <img
                src={imageSrc(image.image)}
                alt={image.alt_text}
                className="aspect-square w-full bg-card object-cover"
              />
              <div className="mt-2 flex items-center justify-between">
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={idx === 0 || pendingId === image.id}
                    onClick={() => handleMove(image, -1)}
                    aria-label="Переместить раньше"
                    className="cursor-pointer border border-line px-2 py-1 text-xs text-ink disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={idx === sorted.length - 1 || pendingId === image.id}
                    onClick={() => handleMove(image, 1)}
                    aria-label="Переместить позже"
                    className="cursor-pointer border border-line px-2 py-1 text-xs text-ink disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    ↓
                  </button>
                </div>
                <button
                  type="button"
                  disabled={pendingId === image.id}
                  onClick={() => handleDelete(image)}
                  className="cursor-pointer text-xs text-red-700 underline underline-offset-2 disabled:opacity-40"
                >
                  Удалить
                </button>
              </div>
              <select
                value={image.color ?? ""}
                disabled={pendingId === image.id}
                onChange={(e) =>
                  handleColorChange(image, e.target.value ? Number(e.target.value) : null)
                }
                className="mt-2 w-full border border-line px-2 py-1.5 text-xs text-ink"
              >
                <option value="">Без цвета</option>
                {colorOptions.map((color) => (
                  <option key={color.id} value={color.id}>
                    {color.name_en}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-xs text-ash">Фото пока не загружены.</p>
      )}

      <label className="mt-4 inline-block cursor-pointer border border-ink px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-ink hover:bg-card">
        {uploading ? "Загрузка…" : "Загрузить фото"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            handleUpload(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}
