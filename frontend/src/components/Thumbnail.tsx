import { mediaUrl } from "@/lib/api";

/**
 * A small square of a product, for the places that list what was bought.
 *
 * Order lines snapshot their text but not their photo (see
 * `orders/serializers.py`), so `src` is null whenever the product has no
 * photography or its variant has since been deleted. There is no mockup to
 * fall back to here — a line carries no garment or swatch to draw one from —
 * so the empty case is a plain square that keeps the row's rhythm rather than
 * pretending to show something.
 */
export function Thumbnail({
  src,
  alt,
  className = "",
}: {
  /** An API path or absolute URL, or null when there is nothing to show. */
  src: string | null;
  alt: string;
  className?: string;
}) {
  if (!src) {
    return <div className={`${className} bg-card`} aria-hidden />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- host is only known at runtime
    <img src={mediaUrl(src)} alt={alt} className={`${className} bg-card object-cover`} />
  );
}
