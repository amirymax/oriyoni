export type Garment = "tee" | "hoodie" | "cap" | "beanie" | "tote";

export type ProductColor = {
  name: string;
  hex: string;
  dark: boolean;
};

export type ProductTag = "new" | "sale" | "bestseller";

export type Product = {
  slug: string;
  name: string;
  category: "Tees" | "Hoodies" | "Accessories";
  garment: Garment;
  price: number;
  compareAtPrice?: number;
  tags: ProductTag[];
  colors: ProductColor[];
  sizes: string[];
  description: string;
  details: string[];
};

export const COLORS = {
  black: { name: "Black", hex: "#0a0a0a", dark: true },
  charcoal: { name: "Charcoal", hex: "#2a2a26", dark: true },
  bone: { name: "Bone", hex: "#efe9db", dark: false },
  natural: { name: "Natural", hex: "#e4d8bd", dark: false },
} as const satisfies Record<string, ProductColor>;

const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const ONE_SIZE = ["One Size"];

export const products: Product[] = [
  {
    slug: "crown-emblem-tee",
    name: "Crown Emblem Tee",
    category: "Tees",
    garment: "tee",
    price: 48,
    tags: ["bestseller"],
    colors: [COLORS.black, COLORS.bone],
    sizes: APPAREL_SIZES,
    description:
      "The signature ORIYONI tee. Heavyweight 240gsm combed cotton with the crest embroidered at the chest.",
    details: [
      "240gsm combed cotton jersey",
      "Embroidered crown crest",
      "Boxy, relaxed fit",
      "Reinforced collar seam",
    ],
  },
  {
    slug: "heavyweight-essential-tee",
    name: "Heavyweight Essential Tee",
    category: "Tees",
    garment: "tee",
    price: 42,
    compareAtPrice: 52,
    tags: ["sale"],
    colors: [COLORS.black, COLORS.charcoal],
    sizes: APPAREL_SIZES,
    description:
      "A no-logo staple built from the same heavyweight cotton as the rest of the line. Made to be worn on repeat.",
    details: [
      "230gsm combed cotton",
      "Clean chest, no branding",
      "Dropped shoulder seam",
      "Garment dyed for depth",
    ],
  },
  {
    slug: "regal-script-tee",
    name: "Regal Script Tee",
    category: "Tees",
    garment: "tee",
    price: 46,
    tags: ["new"],
    colors: [COLORS.black],
    sizes: APPAREL_SIZES,
    description:
      "A back-print script wordmark paired with the crest at the chest. Part of the Fall capsule.",
    details: [
      "220gsm combed cotton",
      "Puff-print back script",
      "Embroidered chest crest",
      "Regular fit",
    ],
  },
  {
    slug: "oversized-crest-tee",
    name: "Oversized Crest Tee",
    category: "Tees",
    garment: "tee",
    price: 50,
    compareAtPrice: 60,
    tags: ["sale"],
    colors: [COLORS.bone, COLORS.black],
    sizes: APPAREL_SIZES,
    description:
      "Drop-shoulder, oversized block fit with an oversized woven crest label at the hem.",
    details: [
      "250gsm heavyweight cotton",
      "Oversized boxy fit",
      "Woven hem crest label",
      "Pre-shrunk fabric",
    ],
  },
  {
    slug: "signature-crown-hoodie",
    name: "Signature Crown Hoodie",
    category: "Hoodies",
    garment: "hoodie",
    price: 88,
    tags: ["bestseller", "new"],
    colors: [COLORS.black, COLORS.bone],
    sizes: APPAREL_SIZES,
    description:
      "The house hoodie. Brushed fleece interior with an embroidered crest and ribbed cuffs built to hold shape.",
    details: [
      "420gsm brushed fleece",
      "Embroidered crown crest",
      "Ribbed cuffs and hem",
      "Kangaroo pocket",
    ],
  },
  {
    slug: "heavyweight-pullover-hoodie",
    name: "Heavyweight Pullover Hoodie",
    category: "Hoodies",
    garment: "hoodie",
    price: 96,
    tags: [],
    colors: [COLORS.black],
    sizes: APPAREL_SIZES,
    description:
      "Maximum weight, minimum branding. A dense double-lined hood and a fit built for layering.",
    details: [
      "450gsm double-lined fleece",
      "Double-lined hood",
      "Dropped shoulder",
      "Clean face, tonal label",
    ],
  },
  {
    slug: "zip-crest-hoodie",
    name: "Zip Crest Hoodie",
    category: "Hoodies",
    garment: "hoodie",
    price: 102,
    compareAtPrice: 120,
    tags: ["sale"],
    colors: [COLORS.charcoal],
    sizes: APPAREL_SIZES,
    description:
      "Full-zip construction with the crest embroidered above the left chest pocket.",
    details: [
      "400gsm brushed fleece",
      "Full metal zip",
      "Embroidered crest",
      "Zippered hand pockets",
    ],
  },
  {
    slug: "oversized-monarch-hoodie",
    name: "Oversized Monarch Hoodie",
    category: "Hoodies",
    garment: "hoodie",
    price: 108,
    tags: ["new"],
    colors: [COLORS.black, COLORS.bone],
    sizes: APPAREL_SIZES,
    description:
      "Our heaviest silhouette — an oversized block fit with an oversized back crest print.",
    details: [
      "460gsm heavyweight fleece",
      "Oversized boxy fit",
      "Oversized back crest print",
      "Extended rib cuffs",
    ],
  },
  {
    slug: "crown-dad-cap",
    name: "Crown Dad Cap",
    category: "Accessories",
    garment: "cap",
    price: 32,
    tags: [],
    colors: [COLORS.black, COLORS.bone],
    sizes: ONE_SIZE,
    description:
      "Low-profile six-panel cap with the crest embroidered at the front and an adjustable strap.",
    details: [
      "Six-panel construction",
      "Embroidered crown crest",
      "Adjustable strap closure",
      "Curved brim",
    ],
  },
  {
    slug: "crest-beanie",
    name: "Crest Beanie",
    category: "Accessories",
    garment: "beanie",
    price: 28,
    tags: ["new"],
    colors: [COLORS.black],
    sizes: ONE_SIZE,
    description:
      "Ribbed knit beanie with a woven crest patch folded into the cuff.",
    details: [
      "Ribbed acrylic knit",
      "Woven crest patch",
      "Fold-cuff construction",
      "One size fits most",
    ],
  },
  {
    slug: "canvas-tote",
    name: "Canvas Tote",
    category: "Accessories",
    garment: "tote",
    price: 26,
    tags: [],
    colors: [COLORS.natural],
    sizes: ONE_SIZE,
    description:
      "Heavy 16oz canvas tote with the crest printed at the face. Built to carry the rest of the line.",
    details: [
      "16oz heavyweight canvas",
      "Printed crown crest",
      "Reinforced stitched handles",
      "Interior pocket",
    ],
  },
];

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function getRelated(product: Product, count = 4) {
  return products
    .filter((p) => p.slug !== product.slug && p.category === product.category)
    .concat(products.filter((p) => p.slug !== product.slug && p.category !== product.category))
    .slice(0, count);
}

export const categories = ["Tees", "Hoodies", "Accessories"] as const;
