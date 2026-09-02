"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/Badge";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { formatMoney, listOrders, type OrderListItem, type OrderStatus } from "@/lib/admin";

const PAGE_SIZE = 20;
const STATUSES: OrderStatus[] = ["pending", "paid", "shipped", "delivered", "cancelled"];
const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Ожидает оплаты",
  paid: "Оплачен",
  shipped: "Отправлен",
  delivered: "Доставлен",
  cancelled: "Отменён",
};

export default function AdminOrdersPage() {
  const router = useRouter();

  const [rows, setRows] = useState<OrderListItem[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      try {
        const data = await listOrders({
          search: search || undefined,
          status: (status as OrderStatus) || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          ordering: "-created_at",
          page,
        });
        if (cancelled) return;
        setRows(data.results);
        setCount(data.count);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [search, status, dateFrom, dateTo, page]);

  const columns: Column<OrderListItem>[] = [
    { key: "number", header: "Заказ" },
    { key: "email", header: "Email" },
    { key: "item_count", header: "Товаров" },
    { key: "total", header: "Сумма", render: (row) => formatMoney(row.total) },
    { key: "status", header: "Статус", render: (row) => <Badge tone="outline">{STATUS_LABELS[row.status]}</Badge> },
    {
      key: "created_at",
      header: "Дата",
      render: (row) => new Date(row.created_at).toLocaleDateString("ru-RU"),
    },
  ];

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold uppercase tracking-tight text-ink">Заказы</h1>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Поиск по номеру заказа или email…"
          className="w-64 border border-line px-3 py-2 text-sm text-ink placeholder:text-ash focus:border-ink focus:outline-none"
        />
        <select
          aria-label="Фильтр по статусу"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="border border-line px-3 py-2 text-sm text-ink"
        >
          <option value="">Все статусы</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <input
          type="date"
          aria-label="Дата с"
          value={dateFrom}
          onChange={(e) => {
            setPage(1);
            setDateFrom(e.target.value);
          }}
          className="border border-line px-3 py-2 text-sm text-ink"
        />
        <input
          type="date"
          aria-label="Дата по"
          value={dateTo}
          onChange={(e) => {
            setPage(1);
            setDateTo(e.target.value);
          }}
          className="border border-line px-3 py-2 text-sm text-ink"
        />
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        keyFor={(row) => row.id}
        loading={loading}
        emptyMessage="Заказы не найдены по этим фильтрам."
        onRowClick={(row) => router.push(`/admin/orders/${row.id}`)}
        page={page}
        pageSize={PAGE_SIZE}
        count={count}
        onPageChange={setPage}
      />
    </div>
  );
}
