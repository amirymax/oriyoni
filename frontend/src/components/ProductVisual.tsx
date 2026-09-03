"use client";

import { GarmentMockup } from "@/components/mockups/GarmentMockup";
import type { Garment, ProductPhoto } from "@/lib/products";

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
 * the product has no photos and the mockup is drawn instead. The cart applies
 * the same rule server-side, where it has one line's product rather than the
 * whole catalogue.
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
  photos = [],
  photo,
  colorId,
  garment,
  hex,
  dark,
  alt,
  className = "",
  /** The mockup is a drawing and needs breathing room; a photo fills the box. */
  mockupPadding = "p-8",
}: {
  photos?: ProductPhoto[];
  /** A photo already chosen — a gallery's pick, or a cart line's own. */
  photo?: ProductPhoto | null;
  /** Which colourway is being shown, when the photo is picked from `photos`. */
  colorId?: string;
  garment: Garment;
  hex: string;
  dark: boolean;
  alt: string;
  className?: string;
  mockupPadding?: string;
}) {
  const chosen = photo ?? photoFor(photos, colorId);

  if (!chosen) {
    return (
      <GarmentMockup
        garment={garment}
        color={hex}
        dark={dark}
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
