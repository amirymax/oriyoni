"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/Badge";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { listUsers, type UserListItem } from "@/lib/admin";

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const router = useRouter();

  const [rows, setRows] = useState<UserListItem[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState("");
  const [isStaff, setIsStaff] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      try {
        const data = await listUsers({
          search: search || undefined,
          is_active: isActive ? isActive === "true" : undefined,
          is_staff: isStaff ? isStaff === "true" : undefined,
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
  }, [search, isActive, isStaff, page]);

  const columns: Column<UserListItem>[] = [
    {
      key: "name",
      header: "Пользователь",
      render: (row) => (
        <div>
          <p className="text-ink">{[row.first_name, row.last_name].filter(Boolean).join(" ") || "—"}</p>
          <p className="text-xs text-ash">{row.email}</p>
        </div>
      ),
    },
    { key: "order_count", header: "Заказы" },
    {
      key: "flags",
      header: "Статус",
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          <Badge tone={row.is_active ? "ink" : "outline"}>{row.is_active ? "Активен" : "Заблокирован"}</Badge>
          {row.is_staff ? <Badge tone="champagne">Админ</Badge> : null}
        </div>
      ),
    },
    {
      key: "created_at",
      header: "Регистрация",
      render: (row) => new Date(row.created_at).toLocaleDateString("ru-RU"),
    },
  ];

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold uppercase tracking-tight text-ink">Пользователи</h1>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Поиск по имени или email…"
          className="w-64 border border-line px-3 py-2 text-sm text-ink placeholder:text-ash focus:border-ink focus:outline-none"
        />
        <select
          aria-label="Фильтр по статусу аккаунта"
          value={isActive}
          onChange={(e) => {
            setPage(1);
            setIsActive(e.target.value);
          }}
          className="border border-line px-3 py-2 text-sm text-ink"
        >
          <option value="">Все аккаунты</option>
          <option value="true">Активен</option>
          <option value="false">Заблокирован</option>
        </select>
        <select
          aria-label="Фильтр по правам администратора"
          value={isStaff}
          onChange={(e) => {
            setPage(1);
            setIsStaff(e.target.value);
          }}
          className="border border-line px-3 py-2 text-sm text-ink"
        >
          <option value="">Все</option>
          <option value="true">Только админы</option>
          <option value="false">Не админы</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        keyFor={(row) => row.id}
        loading={loading}
        emptyMessage="Пользователи не найдены по этим фильтрам."
        onRowClick={(row) => router.push(`/admin/users/${row.id}`)}
        page={page}
        pageSize={PAGE_SIZE}
        count={count}
        onPageChange={setPage}
      />
    </div>
  );
}
