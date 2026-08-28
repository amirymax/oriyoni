import type { Localized } from "@/lib/i18n";

export type Garment = "tee" | "hoodie" | "cap" | "beanie" | "tote";

export type ProductColor = {
  /** Stable identifier — safe to persist in cart keys across languages. */
  id: string;
  name: Localized;
  hex: string;
  dark: boolean;
};

export type ProductTag = "new" | "sale" | "bestseller";

export type Category = "Tees" | "Hoodies" | "Accessories";

export type Product = {
  slug: string;
  name: Localized;
  category: Category;
  garment: Garment;
  price: number;
  compareAtPrice?: number;
  tags: ProductTag[];
  colors: ProductColor[];
  sizes: string[];
  description: Localized;
  details: Localized<string[]>;
};

export const COLORS = {
  black: {
    id: "black",
    name: { en: "Black", ru: "Чёрный" },
    hex: "#0a0a0a",
    dark: true,
  },
  charcoal: {
    id: "charcoal",
    name: { en: "Charcoal", ru: "Графитовый" },
    hex: "#2a2a26",
    dark: true,
  },
  bone: {
    id: "bone",
    name: { en: "Bone", ru: "Молочный" },
    hex: "#efe9db",
    dark: false,
  },
  natural: {
    id: "natural",
    name: { en: "Natural", ru: "Натуральный" },
    hex: "#e4d8bd",
    dark: false,
  },
} as const satisfies Record<string, ProductColor>;

const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
export const ONE_SIZE_TOKEN = "One Size";
const ONE_SIZE = [ONE_SIZE_TOKEN];

export const products: Product[] = [
  {
    slug: "crown-emblem-tee",
    name: { en: "Crown Emblem Tee", ru: "Футболка Crown Emblem" },
    category: "Tees",
    garment: "tee",
    price: 48,
    tags: ["bestseller"],
    colors: [COLORS.black, COLORS.bone],
    sizes: APPAREL_SIZES,
    description: {
      en: "The signature ORIYONI tee. Heavyweight 240gsm combed cotton with the crest embroidered at the chest.",
      ru: "Фирменная футболка ORIYONI. Плотный чёсаный хлопок 240 г/м² с вышитым гербом на груди.",
    },
    details: {
      en: [
        "240gsm combed cotton jersey",
        "Embroidered crown crest",
        "Boxy, relaxed fit",
        "Reinforced collar seam",
      ],
      ru: [
        "Джерси из чёсаного хлопка, 240 г/м²",
        "Вышитый герб-корона",
        "Свободный прямой крой",
        "Усиленный шов горловины",
      ],
    },
  },
  {
    slug: "heavyweight-essential-tee",
    name: {
      en: "Heavyweight Essential Tee",
      ru: "Футболка Essential Heavyweight",
    },
    category: "Tees",
    garment: "tee",
    price: 42,
    compareAtPrice: 52,
    tags: ["sale"],
    colors: [COLORS.black, COLORS.charcoal],
    sizes: APPAREL_SIZES,
    description: {
      en: "A no-logo staple built from the same heavyweight cotton as the rest of the line. Made to be worn on repeat.",
      ru: "База без логотипа из того же плотного хлопка, что и вся линейка. Создана, чтобы носить её постоянно.",
    },
    details: {
      en: [
        "230gsm combed cotton",
        "Clean chest, no branding",
        "Dropped shoulder seam",
        "Garment dyed for depth",
      ],
      ru: [
        "Чёсаный хлопок, 230 г/м²",
        "Чистая грудь, без брендинга",
        "Приспущенная линия плеча",
        "Окраска в готовом виде для глубины цвета",
      ],
    },
  },
  {
    slug: "regal-script-tee",
    name: { en: "Regal Script Tee", ru: "Футболка Regal Script" },
    category: "Tees",
    garment: "tee",
    price: 46,
    tags: ["new"],
    colors: [COLORS.black],
    sizes: APPAREL_SIZES,
    description: {
      en: "A back-print script wordmark paired with the crest at the chest. Part of the Fall capsule.",
      ru: "Шрифтовой принт на спине в паре с гербом на груди. Часть осенней капсулы.",
    },
    details: {
      en: [
        "220gsm combed cotton",
        "Puff-print back script",
        "Embroidered chest crest",
        "Regular fit",
      ],
      ru: [
        "Чёсаный хлопок, 220 г/м²",
        "Объёмная печать со шрифтом на спине",
        "Вышитый герб на груди",
        "Классическая посадка",
      ],
    },
  },
  {
    slug: "oversized-crest-tee",
    name: { en: "Oversized Crest Tee", ru: "Футболка Crest Oversized" },
    category: "Tees",
    garment: "tee",
    price: 50,
    compareAtPrice: 60,
    tags: ["sale"],
    colors: [COLORS.bone, COLORS.black],
    sizes: APPAREL_SIZES,
    description: {
      en: "Drop-shoulder, oversized block fit with an oversized woven crest label at the hem.",
      ru: "Оверсайз с приспущенным плечом и крупным тканым ярлыком-гербом по низу.",
    },
    details: {
      en: [
        "250gsm heavyweight cotton",
        "Oversized boxy fit",
        "Woven hem crest label",
        "Pre-shrunk fabric",
      ],
      ru: [
        "Плотный хлопок, 250 г/м²",
        "Оверсайз прямого кроя",
        "Тканый ярлык с гербом по низу",
        "Предусадочная ткань",
      ],
    },
  },
  {
    slug: "signature-crown-hoodie",
    name: { en: "Signature Crown Hoodie", ru: "Худи Signature Crown" },
    category: "Hoodies",
    garment: "hoodie",
    price: 88,
    tags: ["bestseller", "new"],
    colors: [COLORS.black, COLORS.bone],
    sizes: APPAREL_SIZES,
    description: {
      en: "The house hoodie. Brushed fleece interior with an embroidered crest and ribbed cuffs built to hold shape.",
      ru: "Главное худи бренда. Начёс изнутри, вышитый герб и манжеты-резинки, которые держат форму.",
    },
    details: {
      en: [
        "420gsm brushed fleece",
        "Embroidered crown crest",
        "Ribbed cuffs and hem",
        "Kangaroo pocket",
      ],
      ru: [
        "Начёсанный флис, 420 г/м²",
        "Вышитый герб-корона",
        "Резинка на манжетах и по низу",
        "Карман-кенгуру",
      ],
    },
  },
  {
    slug: "heavyweight-pullover-hoodie",
    name: {
      en: "Heavyweight Pullover Hoodie",
      ru: "Худи Heavyweight Pullover",
    },
    category: "Hoodies",
    garment: "hoodie",
    price: 96,
    tags: [],
    colors: [COLORS.black],
    sizes: APPAREL_SIZES,
    description: {
      en: "Maximum weight, minimum branding. A dense double-lined hood and a fit built for layering.",
      ru: "Максимум плотности, минимум брендинга. Плотный капюшон на двойной подкладке и посадка под многослойность.",
    },
    details: {
      en: [
        "450gsm double-lined fleece",
        "Double-lined hood",
        "Dropped shoulder",
        "Clean face, tonal label",
      ],
      ru: [
        "Двухслойный флис, 450 г/м²",
        "Капюшон на двойной подкладке",
        "Приспущенное плечо",
        "Чистый перёд, тональный ярлык",
      ],
    },
  },
  {
    slug: "zip-crest-hoodie",
    name: { en: "Zip Crest Hoodie", ru: "Худи Zip Crest" },
    category: "Hoodies",
    garment: "hoodie",
    price: 102,
    compareAtPrice: 120,
    tags: ["sale"],
    colors: [COLORS.charcoal],
    sizes: APPAREL_SIZES,
    description: {
      en: "Full-zip construction with the crest embroidered above the left chest pocket.",
      ru: "Худи на молнии во всю длину с гербом, вышитым над левым нагрудным карманом.",
    },
    details: {
      en: [
        "400gsm brushed fleece",
        "Full metal zip",
        "Embroidered crest",
        "Zippered hand pockets",
      ],
      ru: [
        "Начёсанный флис, 400 г/м²",
        "Металлическая молния во всю длину",
        "Вышитый герб",
        "Боковые карманы на молнии",
      ],
    },
  },
  {
    slug: "oversized-monarch-hoodie",
    name: { en: "Oversized Monarch Hoodie", ru: "Худи Monarch Oversized" },
    category: "Hoodies",
    garment: "hoodie",
    price: 108,
    tags: ["new"],
    colors: [COLORS.black, COLORS.bone],
    sizes: APPAREL_SIZES,
    description: {
      en: "Our heaviest silhouette — an oversized block fit with an oversized back crest print.",
      ru: "Самый плотный силуэт в линейке — оверсайз с крупным принтом-гербом на спине.",
    },
    details: {
      en: [
        "460gsm heavyweight fleece",
        "Oversized boxy fit",
        "Oversized back crest print",
        "Extended rib cuffs",
      ],
      ru: [
        "Плотный флис, 460 г/м²",
        "Оверсайз прямого кроя",
        "Крупный принт с гербом на спине",
        "Удлинённые манжеты-резинки",
      ],
    },
  },
  {
    slug: "crown-dad-cap",
    name: { en: "Crown Dad Cap", ru: "Кепка Crown Dad" },
    category: "Accessories",
    garment: "cap",
    price: 32,
    tags: [],
    colors: [COLORS.black, COLORS.bone],
    sizes: ONE_SIZE,
    description: {
      en: "Low-profile six-panel cap with the crest embroidered at the front and an adjustable strap.",
      ru: "Кепка с низким профилем и шестью панелями, вышитый герб спереди и регулируемый ремешок.",
    },
    details: {
      en: [
        "Six-panel construction",
        "Embroidered crown crest",
        "Adjustable strap closure",
        "Curved brim",
      ],
      ru: [
        "Шестипанельная конструкция",
        "Вышитый герб-корона",
        "Регулируемый ремешок",
        "Изогнутый козырёк",
      ],
    },
  },
  {
    slug: "crest-beanie",
    name: { en: "Crest Beanie", ru: "Шапка Crest" },
    category: "Accessories",
    garment: "beanie",
    price: 28,
    tags: ["new"],
    colors: [COLORS.black],
    sizes: ONE_SIZE,
    description: {
      en: "Ribbed knit beanie with a woven crest patch folded into the cuff.",
      ru: "Вязаная шапка в рубчик с тканой нашивкой-гербом на отвороте.",
    },
    details: {
      en: [
        "Ribbed acrylic knit",
        "Woven crest patch",
        "Fold-cuff construction",
        "One size fits most",
      ],
      ru: [
        "Акриловая вязка в рубчик",
        "Тканая нашивка с гербом",
        "Конструкция с отворотом",
        "Универсальный размер",
      ],
    },
  },
  {
    slug: "canvas-tote",
    name: { en: "Canvas Tote", ru: "Шоппер Canvas" },
    category: "Accessories",
    garment: "tote",
    price: 26,
    tags: [],
    colors: [COLORS.natural],
    sizes: ONE_SIZE,
    description: {
      en: "Heavy 16oz canvas tote with the crest printed at the face. Built to carry the rest of the line.",
      ru: "Плотный шоппер из канваса 16 унций с печатным гербом. Создан, чтобы носить остальную линейку.",
    },
    details: {
      en: [
        "16oz heavyweight canvas",
        "Printed crown crest",
        "Reinforced stitched handles",
        "Interior pocket",
      ],
      ru: [
        "Плотный канвас, 16 унций",
        "Печатный герб-корона",
        "Усиленные прошитые ручки",
        "Внутренний карман",
      ],
    },
  },
];

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function getRelated(product: Product, count = 4) {
  return products
    .filter((p) => p.slug !== product.slug && p.category === product.category)
    .concat(
      products.filter(
        (p) => p.slug !== product.slug && p.category !== product.category
      )
    )
    .slice(0, count);
}

export const categories = ["Tees", "Hoodies", "Accessories"] as const;
