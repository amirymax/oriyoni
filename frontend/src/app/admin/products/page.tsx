"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/Badge";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { listCategories, listProducts, type CategoryAdmin, type Garment, type ProductListItem } from "@/lib/admin";

const PAGE_SIZE = 20;
const GARMENTS: Garment[] = ["tee", "hoodie", "cap", "beanie", "tote"];
const GARMENT_LABELS: Record<Garment, string> = {
  tee: "Футболка",
  hoodie: "Худи",
  cap: "Кепка",
  beanie: "Шапка",
  tote: "Сумка",
};

export default function AdminProductsPage() {
  const router = useRouter();

  const [rows, setRows] = useState<ProductListItem[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [isActive, setIsActive] = useState("");
  const [garment, setGarment] = useState("");

  const [categories, setCategories] = useState<CategoryAdmin[]>([]);

  useEffect(() => {
    listCategories({ page: 1 })
      .then((data) => setCategories(data.results))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      try {
        const data = await listProducts({
          search: search || undefined,
          category: category ? Number(category) : undefined,
          is_active: isActive ? isActive === "true" : undefined,
          garment: (garment as Garment) || undefined,
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
  }, [search, category, isActive, garment, page]);

  const columns: Column<ProductListItem>[] = [
    {
      key: "name",
      header: "Товар",
      render: (row) => (
        <div>
          <p className="font-medium">{row.name_en}</p>
          <p className="text-xs text-ash">{row.slug}</p>
        </div>
      ),
    },
    { key: "category", header: "Категория", render: (row) => row.category?.name_en ?? "—" },
    { key: "garment", header: "Тип", render: (row) => GARMENT_LABELS[row.garment] },
    {
      key: "price",
      header: "Цена",
      render: (row) => (
        <span>
          ${row.price.toFixed(2)}
          {row.compare_at_price ? (
            <span className="ml-1.5 text-ash line-through">${row.compare_at_price.toFixed(2)}</span>
          ) : null}
        </span>
      ),
    },
    {
      key: "status",
      header: "Статус",
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          <Badge tone={row.is_active ? "ink" : "outline"}>{row.is_active ? "Активен" : "Скрыт"}</Badge>
          {!row.in_stock ? <Badge tone="outline">Нет в наличии</Badge> : null}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">Товары</h1>
        <Link
          href="/admin/products/new"
          className="cursor-pointer bg-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-white hover:opacity-85"
        >
          Новый товар
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Поиск товаров…"
          className="w-56 border border-line px-3 py-2 text-sm text-ink placeholder:text-ash focus:border-ink focus:outline-none"
        />
        <select
          aria-label="Фильтр по категории"
          value={category}
          onChange={(e) => {
            setPage(1);
            setCategory(e.target.value);
          }}
          className="border border-line px-3 py-2 text-sm text-ink"
        >
          <option value="">Все категории</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name_en}
            </option>
          ))}
        </select>
        <select
          aria-label="Фильтр по типу"
          value={garment}
          onChange={(e) => {
            setPage(1);
            setGarment(e.target.value);
          }}
          className="border border-line px-3 py-2 text-sm text-ink"
        >
          <option value="">Все типы</option>
          {GARMENTS.map((g) => (
            <option key={g} value={g}>
              {GARMENT_LABELS[g]}
            </option>
          ))}
        </select>
        <select
          aria-label="Фильтр по статусу"
          value={isActive}
          onChange={(e) => {
            setPage(1);
            setIsActive(e.target.value);
          }}
          className="border border-line px-3 py-2 text-sm text-ink"
        >
          <option value="">Все статусы</option>
          <option value="true">Активен</option>
          <option value="false">Скрыт</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        keyFor={(row) => row.id}
        loading={loading}
        emptyMessage="Товары не найдены по этим фильтрам."
        onRowClick={(row) => router.push(`/admin/products/${row.id}`)}
        page={page}
        pageSize={PAGE_SIZE}
        count={count}
        onPageChange={setPage}
      />
    </div>
  );
}
