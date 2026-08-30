"use client";

import { use, useEffect, useState } from "react";
import { FormError, FormNotice } from "@/components/form";
import { ApiError } from "@/lib/api";
import { getOrder, updateOrderStatus, type OrderDetailAdmin, type OrderStatus } from "@/lib/admin";

const STATUSES: OrderStatus[] = ["pending", "paid", "shipped", "delivered", "cancelled"];
const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Ожидает оплаты",
  paid: "Оплачен",
  shipped: "Отправлен",
  delivered: "Доставлен",
  cancelled: "Отменён",
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const orderId = Number(id);

  const [order, setOrder] = useState<OrderDetailAdmin | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getOrder(orderId)
      .then((data) => !cancelled && setOrder(data))
      .catch((caught) => !cancelled && setLoadError(caught instanceof ApiError ? caught.message : "Не удалось загрузить заказ."));
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  async function handleStatusChange(status: OrderStatus) {
    if (!order) return;
    setSaving(true);
    setStatusError(null);
    setSaved(false);
    try {
      const updated = await updateOrderStatus(order.id, status);
      setOrder(updated);
      setSaved(true);
    } catch (caught) {
      setStatusError(caught instanceof ApiError ? caught.message : "Не удалось обновить статус.");
    } finally {
      setSaving(false);
    }
  }

  if (loadError) return <p className="text-sm text-red-700">{loadError}</p>;
  if (!order) return <p className="text-sm text-graphite">Загрузка…</p>;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">{order.number}</h1>
          <p className="mt-1 text-xs text-ash">
            {order.email} · оформлен {new Date(order.created_at).toLocaleString("ru-RU")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="order_status" className="text-xs font-semibold uppercase tracking-[0.08em] text-ink">
            Статус
          </label>
          <select
            id="order_status"
            value={order.status}
            disabled={saving}
            onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
            className="border border-line px-3 py-2 text-sm text-ink"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <FormError>{statusError}</FormError>
      {saved ? <FormNotice>Статус обновлён.</FormNotice> : null}

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.1em] text-ink">Товары в заказе</h2>
          <div className="overflow-x-auto border border-line">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line bg-card text-xs font-semibold uppercase tracking-[0.08em] text-graphite">
                  <th className="px-4 py-3 text-left">Товар</th>
                  <th className="px-4 py-3 text-left">Цвет / Размер</th>
                  <th className="px-4 py-3 text-right">Кол-во</th>
                  <th className="px-4 py-3 text-right">Цена</th>
                  <th className="px-4 py-3 text-right">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b border-line last:border-b-0">
                    <td className="px-4 py-3">
                      <p className="text-ink">{item.name_en}</p>
                      <p className="text-xs text-ash">{item.sku}</p>
                    </td>
                    <td className="px-4 py-3 text-ink">
                      {item.color_name_en} · {item.size}
                    </td>
                    <td className="px-4 py-3 text-right text-ink">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-ink">${item.unit_price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-ink">${item.line_total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 ml-auto max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-ash">Подытог</span>
              <span className="text-ink">${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ash">Доставка</span>
              <span className="text-ink">${order.shipping.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-ink">Итого</span>
              <span className="text-ink">${order.total.toFixed(2)}</span>
            </div>
          </div>

          {order.note ? (
            <div className="mt-6">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink">Комментарий</h3>
              <p className="text-sm text-graphite">{order.note}</p>
            </div>
          ) : null}
        </section>

        <section>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.1em] text-ink">Адрес доставки</h2>
          <div className="space-y-1 border border-line px-4 py-4 text-sm text-ink">
            <p>{order.shipping_name}</p>
            <p>{order.shipping_line1}</p>
            {order.shipping_line2 ? <p>{order.shipping_line2}</p> : null}
            <p>
              {order.shipping_city}, {order.shipping_postal_code}
            </p>
            <p>{order.shipping_country}</p>
            {order.shipping_phone ? <p className="pt-2 text-ash">{order.shipping_phone}</p> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
