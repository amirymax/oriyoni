"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Field, FormError, SubmitButton } from "@/components/form";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { ApiError, api, type Order } from "@/lib/api";
import { sizeLabel } from "@/lib/display";
import { fmt } from "@/lib/i18n";

export default function CheckoutPage() {
  const { t, l, price } = useLanguage();
  const { lines, subtotal, loading, refresh } = useCart();
  const { user } = useAuth();

  const [placed, setPlaced] = useState<Order | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [pending, setPending] = useState(false);

  const [form, setForm] = useState({
    email: "",
    shipping_name: "",
    shipping_line1: "",
    shipping_line2: "",
    shipping_city: "",
    shipping_postal_code: "",
    shipping_country: "",
    shipping_phone: "",
    note: "",
  });

  // A signed-in shopper should not retype what the account already knows.
  // The session arrives after the first render, so this is the documented
  // "adjust state when a prop changes" pattern rather than an effect —
  // prefilling in an effect would render the empty form first and then
  // overwrite it.
  const [prefilledFor, setPrefilledFor] = useState<number | null>(null);
  if (user && prefilledFor !== user.id) {
    setPrefilledFor(user.id);
    setForm((current) => ({
      ...current,
      email: current.email || user.email,
      shipping_name: current.shipping_name || user.full_name,
    }));
  }

  function set(field: keyof typeof form) {
    return (value: string) => setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const order = await api<Order>("/api/orders/checkout/", {
        method: "POST",
        body: form,
      });
      setPlaced(order);
      // Checkout empties the cart server-side; pull that through so the
      // header badge does not keep showing items that are now on an order.
      await refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught : new ApiError(0, t.authOffline));
    } finally {
      setPending(false);
    }
  }

  if (placed) {
    return <Confirmation order={placed} />;
  }

  if (!loading && lines.length === 0) {
    return (
      <>
        <PageHeader title={t.checkoutTitle} />
        <div className="container-shell flex flex-col items-center gap-5 py-20 text-center">
          <p className="text-sm text-ash">{t.checkoutEmpty}</p>
          <Link
            href="/shop"
            className="cursor-pointer bg-ink px-7 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white"
          >
            {t.wishlistCta}
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title={t.checkoutTitle} description={t.checkoutDescription} />
      <div className="container-shell py-10 sm:py-14">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.2fr_1fr]">
          <form onSubmit={handleSubmit} className="space-y-8" noValidate>
            <FormError>{error?.banner}</FormError>
            {error?.errors.items ? <FormError>{error.errors.items[0]}</FormError> : null}
            {error?.errors.cart ? <FormError>{error.errors.cart[0]}</FormError> : null}

            <section className="space-y-5">
              <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-ink">
                {t.checkoutContact}
              </h2>
              <Field
                id="email"
                label={t.authEmail}
                type="email"
                value={form.email}
                onChange={set("email")}
                error={error?.field("email")}
                autoComplete="email"
                required
              />
            </section>

            <section className="space-y-5">
              <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-ink">
                {t.checkoutShippingHeading}
              </h2>
              <Field
                id="shipping_name"
                label={t.checkoutName}
                value={form.shipping_name}
                onChange={set("shipping_name")}
                error={error?.field("shipping_name")}
                autoComplete="name"
                required
              />
              <Field
                id="shipping_line1"
                label={t.checkoutLine1}
                value={form.shipping_line1}
                onChange={set("shipping_line1")}
                error={error?.field("shipping_line1")}
                autoComplete="address-line1"
                required
              />
              <Field
                id="shipping_line2"
                label={t.checkoutLine2}
                value={form.shipping_line2}
                onChange={set("shipping_line2")}
                error={error?.field("shipping_line2")}
                autoComplete="address-line2"
              />
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field
                  id="shipping_city"
                  label={t.checkoutCity}
                  value={form.shipping_city}
                  onChange={set("shipping_city")}
                  error={error?.field("shipping_city")}
                  autoComplete="address-level2"
                  required
                />
                <Field
                  id="shipping_postal_code"
                  label={t.checkoutPostalCode}
                  value={form.shipping_postal_code}
                  onChange={set("shipping_postal_code")}
                  error={error?.field("shipping_postal_code")}
                  autoComplete="postal-code"
                  required
                />
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field
                  id="shipping_country"
                  label={t.checkoutCountry}
                  value={form.shipping_country}
                  onChange={set("shipping_country")}
                  error={error?.field("shipping_country")}
                  autoComplete="country"
                  placeholder={t.checkoutCountryHint}
                  required
                />
                <Field
                  id="shipping_phone"
                  label={t.checkoutPhone}
                  value={form.shipping_phone}
                  onChange={set("shipping_phone")}
                  error={error?.field("shipping_phone")}
                  autoComplete="tel"
                />
              </div>
              <Field
                id="note"
                label={t.checkoutNote}
                value={form.note}
                onChange={set("note")}
                error={error?.field("note")}
              />
            </section>

            <div>
              <SubmitButton pending={pending} pendingLabel={t.authWorking}>
                {t.checkoutPlaceOrder}
              </SubmitButton>
              <p className="mt-3 text-center text-[11px] text-ash">
                {t.checkoutPaymentPending}
              </p>
            </div>
          </form>

          <aside className="h-fit border border-line p-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-ink">
              {t.checkoutSummary}
            </h2>
            <ul className="mt-5 divide-y divide-line">
              {lines.map((line) => (
                <li key={line.key} className="flex justify-between gap-4 py-3 text-sm">
                  <span className="min-w-0">
                    <span className="text-ink">{l(line.name)}</span>
                    <span className="mt-0.5 block text-xs text-ash">
                      {l(line.colorName)} · {sizeLabel(line.size, t)} × {line.quantity}
                    </span>
                  </span>
                  <span className="shrink-0 text-ink">
                    {price(line.price * line.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-between border-t border-line pt-4 text-sm font-medium text-ink">
              <span>{t.cartSubtotal}</span>
              <span>{price(subtotal)}</span>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

function Confirmation({ order }: { order: Order }) {
  const { t, l, price } = useLanguage();

  return (
    <>
      <PageHeader title={t.orderPlacedTitle} />
      <div className="container-shell py-10 sm:py-14">
        <div className="mx-auto max-w-xl space-y-8">
          <p className="text-sm text-graphite">
            {fmt(t.orderPlacedCopy, { email: order.email, number: order.number })}
          </p>

          <div className="border border-line">
            <ul className="divide-y divide-line">
              {order.items.map((item) => (
                <li key={item.sku} className="flex justify-between gap-4 px-5 py-4 text-sm">
                  <span className="min-w-0">
                    <span className="text-ink">{l(item.name)}</span>
                    <span className="mt-0.5 block text-xs text-ash">
                      {l(item.color_name)} · {item.size} × {item.quantity}
                    </span>
                  </span>
                  <span className="shrink-0 text-ink">{price(item.line_total)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 border-t border-line px-5 py-4 text-sm">
              <div className="flex justify-between text-graphite">
                <dt>{t.cartSubtotal}</dt>
                <dd>{price(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-graphite">
                <dt>{t.cartShipping}</dt>
                <dd>{order.shipping === 0 ? t.cartFree : price(order.shipping)}</dd>
              </div>
              <div className="flex justify-between font-medium text-ink">
                <dt>{t.orderTotalLabel}</dt>
                <dd>{price(order.total)}</dd>
              </div>
              <div className="flex justify-between text-graphite">
                <dt>{t.orderStatus}</dt>
                <dd>{order.status_label}</dd>
              </div>
            </dl>
          </div>

          <p className="text-[11px] text-ash">{t.checkoutPaymentPending}</p>

          <Link href="/shop" className="text-sm text-ink underline underline-offset-4">
            {t.authBackToShop}
          </Link>
        </div>
      </div>
    </>
  );
}
