import type { Dict } from "@/lib/i18n";
import { ONE_SIZE_TOKEN, type Category } from "@/lib/products";

export function categoryLabel(category: Category, t: Dict) {
  if (category === "Tees") return t.categoryTees;
  if (category === "Hoodies") return t.categoryHoodies;
  return t.categoryAccessories;
}

export function sizeLabel(size: string, t: Dict) {
  return size === ONE_SIZE_TOKEN ? t.sizeOneSize : size;
}
