"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/Badge";
import { ApiError } from "@/lib/api";
import { formatMoney, getDashboard, type Dashboard, type OrderStatus } from "@/lib/admin";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Ожидает оплаты",
  paid: "Оплачен",
  shipped: "Отправлен",
  delivered: "Доставлен",
  cancelled: "Отменён",
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getDashboard()
      .then((d) => !cancelled && setData(d))
      .catch((caught) => !cancelled && setError(caught instanceof ApiError ? caught.message : "Не удалось загрузить дашборд."));
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="text-sm text-red-700">{error}</p>;
  if (!data) return <p className="text-sm text-graphite">Загрузка…</p>;

  const tiles: { label: string; value: string }[] = [
    { label: "Выручка (оплаченные+)", value: formatMoney(data.revenue_total) },
    { label: "Заказы сегодня", value: String(data.orders_today) },
    { label: "Заказы за неделю", value: String(data.orders_this_week) },
    { label: "Заказы в ожидании", value: String(data.orders_pending) },
    { label: "Мало на складе", value: String(data.low_stock_variants) },
    { label: "Активные товары", value: String(data.active_products) },
    { label: "Всего пользователей", value: String(data.total_users) },
  ];

  return (
    <div className="space-y-10">
      <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">Дашборд</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="border border-line px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ash">{tile.label}</p>
            <p className="mt-2 font-display text-2xl font-bold text-ink">{tile.value}</p>
          </div>
        ))}
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-ink">Последние заказы</h2>
          <Link href="/admin/orders" className="text-xs text-ink underline underline-offset-4">
            Смотреть все
          </Link>
        </div>
        {data.recent_orders.length === 0 ? (
          <p className="text-sm text-graphite">Заказов пока нет.</p>
        ) : (
          <div className="overflow-x-auto border border-line">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line bg-card text-xs font-semibold uppercase tracking-[0.08em] text-graphite">
                  <th className="px-4 py-3 text-left">Заказ</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Статус</th>
                  <th className="px-4 py-3 text-right">Сумма</th>
                  <th className="px-4 py-3 text-left">Дата</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_orders.map((order) => (
                  <tr key={order.id} className="border-b border-line last:border-b-0">
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${order.id}`} className="text-ink underline underline-offset-4">
                        {order.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink">{order.email}</td>
                    <td className="px-4 py-3">
                      <Badge tone="outline">{STATUS_LABELS[order.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-ink">{formatMoney(order.total)}</td>
                    <td className="px-4 py-3 text-ink">{new Date(order.created_at).toLocaleDateString("ru-RU")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
