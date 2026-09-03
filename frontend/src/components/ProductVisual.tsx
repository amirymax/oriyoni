"use client";

import { GarmentMockup } from "@/components/mockups/GarmentMockup";
import type { Garment, ProductColor, ProductPhoto } from "@/lib/products";

/**
 * What a product looks like: its photograph, or the drawn mockup.
 *
 * The shop uploads photos per product from the admin panel and may tag each
 * one to a colourway. Until a product has any, it is drawn as a flat garment
 * in the swatch colour — which is what the whole catalogue looked like before
 * there was any photography, and still what a newly added product shows.
 */

/**
 * The photo to show for a colourway.
 *
 * A photo tagged to that colour wins; otherwise an untagged one, which stands
 * for the product as a whole; otherwise simply the first. Nothing at all means
 * the product has no photos and the mockup is drawn instead.
 */
export function photoFor(
  photos: ProductPhoto[],
  colorId?: string
): ProductPhoto | undefined {
  return (
    photos.find((photo) => photo.colorId === colorId) ??
    photos.find((photo) => photo.colorId === null) ??
    photos[0]
  );
}

export function ProductVisual({
  photos,
  garment,
  color,
  alt,
  className = "",
  /** The mockup is a drawing and needs breathing room; a photo fills the box. */
  mockupPadding = "p-8",
  photo,
}: {
  photos: ProductPhoto[];
  garment: Garment;
  color: ProductColor;
  alt: string;
  className?: string;
  mockupPadding?: string;
  /** Overrides the colour-matched pick — for a gallery with its own choice. */
  photo?: ProductPhoto;
}) {
  const chosen = photo ?? photoFor(photos, color.id);

  if (!chosen) {
    return (
      <GarmentMockup
        garment={garment}
        color={color.hex}
        dark={color.dark}
        className={`${className} ${mockupPadding}`}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- host is only known at runtime
    <img
      src={chosen.url}
      alt={chosen.alt || alt}
      className={`${className} object-cover`}
    />
  );
}
