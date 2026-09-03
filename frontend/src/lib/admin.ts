/**
 * Typed access to the staff-only `/api/admin/...` endpoints.
 *
 * Everything here goes through the shared `api()` helper (CSRF + auth-refresh
 * already handled there) rather than raw `fetch`, matching the rest of the
 * codebase. Field names mirror the Django/DRF serializers verbatim, snake_case
 * included, same convention as the shopper-facing types in `api.ts`.
 */

import { api, type Paginated } from "@/lib/api";

// ------------------------------------------------------------------ shared --

/**
 * Money as the admin panel shows it: rubles, Russian grouping, kopecks kept.
 *
 * The panel is Russian-only, so this does not take a language the way the
 * storefront's `formatPrice` does. It keeps two decimals because staff
 * reconcile these figures against orders, where the kopecks matter.
 */
const MONEY = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(value: number | string): string {
  return MONEY.format(Number(value));
}

/** Builds a query string from a params object, dropping empty values. */
function toQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

// -------------------------------------------------------------- categories --

export type CategoryAdmin = {
  id: number;
  slug: string;
  name_en: string;
  name_ru: string;
  position: number;
  product_count: number;
};

export type CategoryAdminInput = {
  slug: string;
  name_en: string;
  name_ru: string;
  position: number;
};

export function listCategories(params: { search?: string; page?: number } = {}) {
  return api<Paginated<CategoryAdmin>>(`/api/admin/categories/${toQuery(params)}`);
}

export function createCategory(body: CategoryAdminInput) {
  return api<CategoryAdmin>("/api/admin/categories/", { method: "POST", body });
}

export function updateCategory(id: number, body: Partial<CategoryAdminInput>) {
  return api<CategoryAdmin>(`/api/admin/categories/${id}/`, { method: "PATCH", body });
}

export function deleteCategory(id: number) {
  return api<void>(`/api/admin/categories/${id}/`, { method: "DELETE" });
}

// ------------------------------------------------------------------ colors --

export type ColorAdmin = {
  id: number;
  slug: string;
  name_en: string;
  name_ru: string;
  hex: string;
  is_dark: boolean;
};

export type ColorAdminInput = {
  slug: string;
  name_en: string;
  name_ru: string;
  hex: string;
  is_dark: boolean;
};

export function listColors(params: { search?: string; page?: number } = {}) {
  return api<Paginated<ColorAdmin>>(`/api/admin/colors/${toQuery(params)}`);
}

export function createColor(body: ColorAdminInput) {
  return api<ColorAdmin>("/api/admin/colors/", { method: "POST", body });
}

export function updateColor(id: number, body: Partial<ColorAdminInput>) {
  return api<ColorAdmin>(`/api/admin/colors/${id}/`, { method: "PATCH", body });
}

export function deleteColor(id: number) {
  return api<void>(`/api/admin/colors/${id}/`, { method: "DELETE" });
}

// ---------------------------------------------------------------- products --

export type Garment = "tee" | "hoodie" | "cap" | "beanie" | "tote";
export type ProductTag = "new" | "sale" | "bestseller";

export type ProductImageAdmin = {
  id: number;
  image: string;
  color: number | null;
  alt_text: string;
  position: number;
};

export type ProductListItem = {
  id: number;
  slug: string;
  name_en: string;
  name_ru: string;
  category: { id: number; slug: string; name_en: string };
  garment: Garment;
  price: number;
  compare_at_price: number | null;
  tags: ProductTag[];
  is_active: boolean;
  position: number;
  in_stock: boolean;
  primary_image: { id: number; image: string; alt_text: string } | null;
  created_at: string;
};

export type VariantColorRead = { id: number; slug: string; name_en: string; hex: string };

export type ProductVariantAdmin = {
  id?: number;
  color: number | VariantColorRead;
  size: string;
  sku: string;
  stock: number;
  is_active: boolean;
};

export type ProductDetailAdmin = Omit<ProductListItem, "category"> & {
  category: { id: number; slug: string; name_en: string } | number;
  description_en: string;
  description_ru: string;
  details_en: string[];
  details_ru: string[];
  variants: ProductVariantAdmin[];
  images: ProductImageAdmin[];
};

export type ProductWriteBody = {
  slug: string;
  name_en: string;
  name_ru: string;
  category: number;
  garment: Garment;
  price: number;
  compare_at_price: number | null;
  tags: ProductTag[];
  is_active: boolean;
  position: number;
  description_en: string;
  description_ru: string;
  details_en: string[];
  details_ru: string[];
  variants: {
    id?: number;
    color: number;
    size: string;
    sku: string;
    stock: number;
    is_active: boolean;
  }[];
};

export function listProducts(
  params: {
    search?: string;
    category?: number;
    is_active?: boolean;
    garment?: Garment;
    ordering?: string;
    page?: number;
  } = {}
) {
  return api<Paginated<ProductListItem>>(`/api/admin/products/${toQuery(params)}`);
}

export function getProduct(id: number) {
  return api<ProductDetailAdmin>(`/api/admin/products/${id}/`);
}

export function createProduct(body: ProductWriteBody) {
  return api<ProductDetailAdmin>("/api/admin/products/", { method: "POST", body });
}

export function updateProduct(id: number, body: Partial<ProductWriteBody>) {
  return api<ProductDetailAdmin>(`/api/admin/products/${id}/`, { method: "PATCH", body });
}

export function deleteProduct(id: number) {
  return api<void>(`/api/admin/products/${id}/`, { method: "DELETE" });
}

// ---------------------------------------------------------- product images --

export function listProductImages(productId: number) {
  return api<ProductImageAdmin[] | Paginated<ProductImageAdmin>>(
    `/api/admin/product-images/?product=${productId}`
  ).then((data) => (Array.isArray(data) ? data : data.results));
}

export function uploadProductImage(body: {
  product: number;
  image: File;
  color?: number | null;
  alt_text?: string;
  position?: number;
}) {
  const form = new FormData();
  form.set("product", String(body.product));
  form.set("image", body.image);
  if (body.color !== undefined && body.color !== null) form.set("color", String(body.color));
  if (body.alt_text !== undefined) form.set("alt_text", body.alt_text);
  if (body.position !== undefined) form.set("position", String(body.position));
  return api<ProductImageAdmin>("/api/admin/product-images/", { method: "POST", body: form });
}

export function updateProductImage(
  id: number,
  body: Partial<{ color: number | null; alt_text: string; position: number }>
) {
  return api<ProductImageAdmin>(`/api/admin/product-images/${id}/`, { method: "PATCH", body });
}

export function deleteProductImage(id: number) {
  return api<void>(`/api/admin/product-images/${id}/`, { method: "DELETE" });
}

// ------------------------------------------------------------------ orders --

export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";

export type OrderListItem = {
  id: number;
  number: string;
  email: string;
  status: OrderStatus;
  item_count: number;
  total: number;
  created_at: string;
};

export type OrderItemAdmin = {
  id: number;
  sku: string;
  product_slug: string;
  name_en: string;
  name_ru: string;
  color_name_en: string;
  color_name_ru: string;
  /** The product's photo, or null — a deleted variant, or no photography. */
  image: string | null;
  size: string;
  unit_price: number;
  quantity: number;
  line_total: number;
};

export type OrderDetailAdmin = {
  id: number;
  number: string;
  email: string;
  status: OrderStatus;
  subtotal: number;
  shipping: number;
  total: number;
  shipping_name: string;
  shipping_line1: string;
  shipping_line2: string;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_country: string;
  shipping_phone: string;
  note: string;
  created_at: string;
  user: number | null;
  items: OrderItemAdmin[];
};

export function listOrders(
  params: {
    search?: string;
    status?: OrderStatus;
    date_from?: string;
    date_to?: string;
    ordering?: string;
    page?: number;
  } = {}
) {
  return api<Paginated<OrderListItem>>(`/api/admin/orders/${toQuery(params)}`);
}

export function getOrder(id: number) {
  return api<OrderDetailAdmin>(`/api/admin/orders/${id}/`);
}

export function updateOrderStatus(id: number, status: OrderStatus) {
  return api<OrderDetailAdmin>(`/api/admin/orders/${id}/`, { method: "PATCH", body: { status } });
}

// ------------------------------------------------------------------- users --

export type UserListItem = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_staff: boolean;
  order_count: number;
  created_at: string;
};

export type UserOrderSummary = {
  id: number;
  number: string;
  status: OrderStatus;
  total: number;
  created_at: string;
};

export type UserDetailAdmin = UserListItem & {
  orders: UserOrderSummary[];
};

export function listUsers(
  params: {
    search?: string;
    is_active?: boolean;
    is_staff?: boolean;
    ordering?: string;
    page?: number;
  } = {}
) {
  return api<Paginated<UserListItem>>(`/api/admin/users/${toQuery(params)}`);
}

export function getUser(id: number) {
  return api<UserDetailAdmin>(`/api/admin/users/${id}/`);
}

export function updateUser(id: number, body: Partial<{ is_active: boolean; is_staff: boolean }>) {
  return api<UserDetailAdmin>(`/api/admin/users/${id}/`, { method: "PATCH", body });
}

// -------------------------------------------------------------- dashboard --

export type RecentOrder = {
  id: number;
  number: string;
  email: string;
  status: OrderStatus;
  total: string;
  created_at: string;
};

export type Dashboard = {
  revenue_total: string;
  orders_today: number;
  orders_this_week: number;
  orders_pending: number;
  low_stock_variants: number;
  active_products: number;
  total_users: number;
  recent_orders: RecentOrder[];
};

export function getDashboard() {
  return api<Dashboard>("/api/admin/dashboard/");
}

// ------------------------------------------------------------- analytics --

export type Granularity = "day" | "week" | "month";

export type RevenuePoint = { period: string; revenue: string; orders: number };
export type TopProduct = { product_slug: string; name_en: string; quantity: number; revenue: string };
export type CategoryPerformance = {
  category_slug: string;
  name_en: string;
  quantity: number;
  revenue: string;
};
export type StatusBreakdown = { status: OrderStatus | string; count: number };

export type Analytics = {
  date_from: string;
  date_to: string;
  revenue_series: RevenuePoint[];
  top_products: TopProduct[];
  category_performance: CategoryPerformance[];
  status_breakdown: StatusBreakdown[];
  average_order_value: string;
  order_count: number;
};

export function getAnalytics(
  params: { date_from?: string; date_to?: string; granularity?: Granularity } = {}
) {
  return api<Analytics>(`/api/admin/analytics/${toQuery(params)}`);
}
