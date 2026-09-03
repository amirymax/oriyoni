/**
 * Talking to the Django API.
 *
 * Two things make this more than a `fetch` alias:
 *
 * - Auth tokens live in httpOnly cookies, so every request must opt into
 *   sending credentials, and every write must carry the CSRF token that
 *   proves it came from this page rather than a hostile one.
 * - Access tokens expire after fifteen minutes. Rather than making every
 *   caller handle that, a 401 is retried once behind a token refresh.
 */

import type { Localized } from "@/lib/i18n";

export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

/**
 * An uploaded file's URL, ready for `<img src>`.
 *
 * DRF returns an absolute URL when the serializer can see the request, and a
 * bare `/media/…` path when it cannot — the cart and the wishlist serialize
 * without one. Callers should not have to know which they got.
 */
export function mediaUrl(path: string): string {
  return path.startsWith("http") ? path : `${API_URL}${path}`;
}

/** The `{detail, errors}` shape every endpoint returns on failure. */
export class ApiError extends Error {
  readonly status: number;
  readonly errors: Record<string, string[]>;

  constructor(status: number, detail: string, errors: Record<string, string[]> = {}) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }

  /** The first message for a field, for rendering under the input. */
  field(name: string): string | undefined {
    return this.errors[name]?.[0];
  }

  /**
   * The message to show above a form, if any.
   *
   * When every problem is already shown under its own field, repeating a
   * generic "the submitted data was not valid" on top is noise — so this
   * returns nothing in that case.
   */
  get banner(): string | undefined {
    const unnamed = this.errors.non_field_errors?.[0];
    if (unnamed) return unnamed;
    return Object.keys(this.errors).length > 0 ? undefined : this.message;
  }
}

type Options = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Set internally to stop a refreshed request refreshing again. */
  retried?: boolean;
};

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];
}

/**
 * Make sure a CSRF cookie exists before the first write.
 *
 * A visitor who has never posted anything has no token yet, so the login form
 * would be refused on its very first submit without this.
 */
async function ensureCsrfToken(): Promise<string | undefined> {
  const existing = readCookie("csrftoken");
  if (existing) return existing;

  await fetch(`${API_URL}/api/auth/csrf/`, { credentials: "include" });
  return readCookie("csrftoken");
}

async function refreshSession(): Promise<boolean> {
  const token = await ensureCsrfToken();
  const response = await fetch(`${API_URL}/api/auth/refresh/`, {
    method: "POST",
    credentials: "include",
    headers: token ? { "X-CSRFToken": token } : undefined,
  });
  return response.ok;
}

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const { method = "GET", body, retried = false } = options;
  const headers: Record<string, string> = {};

  // FormData (multipart uploads) sets its own Content-Type with a boundary —
  // stringifying it or overriding that header would corrupt the request.
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  if (body !== undefined && !isFormData) headers["Content-Type"] = "application/json";

  if (method !== "GET") {
    const token = await ensureCsrfToken();
    if (token) headers["X-CSRFToken"] = token;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    credentials: "include",
    headers,
    body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
  });

  // The access token lapsed mid-session. Refresh once and try again, so the
  // shopper never sees a spurious "please sign in".
  if (response.status === 401 && !retried && !path.startsWith("/api/auth/refresh")) {
    if (await refreshSession()) {
      return api<T>(path, { ...options, retried: true });
    }
  }

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.detail ?? `Request failed (${response.status}).`,
      payload?.errors ?? {}
    );
  }

  return payload as T;
}

// ------------------------------------------------------------------ types --
// These mirror the API's serializers. Field names are snake_case, matching
// Django rather than the storefront's own camelCase conventions.

export type User = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  /** Whether the address has been confirmed by following the emailed link. */
  email_verified: boolean;
  created_at: string;
  is_staff: boolean;
};

export type ApiColor = {
  slug: string;
  name: Localized;
  hex: string;
  is_dark: boolean;
};

export type ApiProductImage = {
  /** Absolute when the API is asked over HTTP; a `/media/…` path otherwise. */
  image: string;
  /** The colourway slug this photo is tagged with, if any. */
  color: string | null;
  alt_text: string;
  position: number;
};

export type ApiVariant = {
  sku: string;
  color: string;
  size: string;
  in_stock: boolean;
};

export type ApiProduct = {
  slug: string;
  name: Localized;
  description: Localized;
  category: string;
  garment: string;
  price: number;
  compare_at_price: number | null;
  tags: string[];
  colors: ApiColor[];
  sizes: string[];
  images: ApiProductImage[];
  is_on_sale: boolean;
  in_stock: boolean;
};

export type ApiProductDetail = ApiProduct & {
  details: Localized<string[]>;
  variants: ApiVariant[];
};

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type CartLine = {
  id: number;
  sku: string;
  product_slug: string;
  name: Localized;
  garment: string;
  color: ApiColor;
  /** The product photo for this colourway, or null to draw the mockup. */
  image: string | null;
  size: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  available: number;
};

export type Cart = {
  items: CartLine[];
  count: number;
  subtotal: number;
};

export type OrderLine = {
  sku: string;
  product_slug: string;
  name: Localized;
  color_name: Localized;
  size: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  /** The product's photo, or null — a deleted variant, or no photography. */
  image: string | null;
};

export type Order = {
  number: string;
  status: string;
  status_label: string;
  email: string;
  subtotal: number;
  shipping: number;
  total: number;
  item_count: number;
  items: OrderLine[];
  note: string;
  created_at: string;
  shipping_name: string;
  shipping_line1: string;
  shipping_line2: string;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_country: string;
  shipping_phone: string;
};
