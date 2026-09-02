"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ApiError } from "@/lib/api";
import {
  formatMoney,
  getAnalytics,
  type Analytics,
  type Granularity,
  type OrderStatus,
} from "@/lib/admin";

const INK = "#0a0a0a";
const CHAMPAGNE = "#c9b483";
const LINE = "#e6e4da";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Ожидает оплаты",
  paid: "Оплачен",
  shipped: "Отправлен",
  delivered: "Доставлен",
  cancelled: "Отменён",
};

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function defaultRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: toISODate(from), to: toISODate(to) };
}

export default function AdminAnalyticsPage() {
  const initialRange = defaultRange();
  const [dateFrom, setDateFrom] = useState(initialRange.from);
  const [dateTo, setDateTo] = useState(initialRange.to);
  const [granularity, setGranularity] = useState<Granularity>("day");

  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      try {
        const d = await getAnalytics({ date_from: dateFrom, date_to: dateTo, granularity });
        if (!cancelled) setData(d);
      } catch (caught) {
        if (!cancelled) setError(caught instanceof ApiError ? caught.message : "Не удалось загрузить аналитику.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [dateFrom, dateTo, granularity]);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">Аналитика</h1>
        <div className="flex flex-wrap gap-3">
          <input
            type="date"
            aria-label="Дата с"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border border-line px-3 py-2 text-sm text-ink"
          />
          <input
            type="date"
            aria-label="Дата по"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border border-line px-3 py-2 text-sm text-ink"
          />
          <select
            aria-label="Группировка"
            value={granularity}
            onChange={(e) => setGranularity(e.target.value as Granularity)}
            className="border border-line px-3 py-2 text-sm text-ink"
          >
            <option value="day">По дням</option>
            <option value="week">По неделям</option>
            <option value="month">По месяцам</option>
          </select>
        </div>
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {loading && !data ? <p className="text-sm text-graphite">Загрузка…</p> : null}

      {data ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
            <div className="border border-line px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ash">Средний чек</p>
              <p className="mt-2 font-display text-2xl font-bold text-ink">
                {formatMoney(data.average_order_value)}
              </p>
            </div>
            <div className="border border-line px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ash">Заказы</p>
              <p className="mt-2 font-display text-2xl font-bold text-ink">{data.order_count}</p>
            </div>
          </div>

          <section>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.1em] text-ink">Выручка по времени</h2>
            <div className="h-72 border border-line px-2 py-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.revenue_series.map((p) => ({ ...p, revenue: Number(p.revenue) }))}>
                  <CartesianGrid stroke={LINE} vertical={false} />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#8c8a80" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#8c8a80" }} width={60} />
                  <Tooltip
                    contentStyle={{ border: `1px solid ${LINE}`, borderRadius: 0, fontSize: 12 }}
                    formatter={(value) => [formatMoney(value as number), "Выручка"]}
                  />
                  <Line type="monotone" dataKey="revenue" stroke={INK} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            <section>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.1em] text-ink">Топ товаров</h2>
              <div className="overflow-x-auto border border-line">
                <table className="w-full min-w-[420px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-line bg-card text-xs font-semibold uppercase tracking-[0.08em] text-graphite">
                      <th className="px-4 py-3 text-left">Товар</th>
                      <th className="px-4 py-3 text-right">Кол-во</th>
                      <th className="px-4 py-3 text-right">Выручка</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_products.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-6 text-center text-xs text-ash">
                          Нет данных за этот период.
                        </td>
                      </tr>
                    ) : (
                      data.top_products.map((p) => (
                        <tr key={p.product_slug} className="border-b border-line last:border-b-0">
                          <td className="px-4 py-3 text-ink">{p.name_en}</td>
                          <td className="px-4 py-3 text-right text-ink">{p.quantity}</td>
                          <td className="px-4 py-3 text-right text-ink">{formatMoney(p.revenue)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.1em] text-ink">Показатели по категориям</h2>
              <div className="h-64 border border-line px-2 py-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.category_performance.map((c) => ({ ...c, revenue: Number(c.revenue) }))}>
                    <CartesianGrid stroke={LINE} vertical={false} />
                    <XAxis dataKey="name_en" tick={{ fontSize: 11, fill: "#8c8a80" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#8c8a80" }} width={60} />
                    <Tooltip
                      contentStyle={{ border: `1px solid ${LINE}`, borderRadius: 0, fontSize: 12 }}
                      formatter={(value) => [formatMoney(value as number), "Выручка"]}
                    />
                    <Bar dataKey="revenue" fill={CHAMPAGNE} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          <section>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.1em] text-ink">Заказы по статусам</h2>
            <div className="h-56 border border-line px-2 py-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.status_breakdown} layout="vertical">
                  <CartesianGrid stroke={LINE} horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#8c8a80" }} />
                  <YAxis
                    dataKey="status"
                    type="category"
                    tick={{ fontSize: 11, fill: "#8c8a80" }}
                    width={90}
                    tickFormatter={(value: string) => STATUS_LABELS[value as OrderStatus] ?? value}
                  />
                  <Tooltip
                    contentStyle={{ border: `1px solid ${LINE}`, borderRadius: 0, fontSize: 12 }}
                    labelFormatter={(value) => STATUS_LABELS[value as OrderStatus] ?? value}
                  />
                  <Bar dataKey="count" fill={INK} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
