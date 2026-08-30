"use client";

import type { ReactNode } from "react";

export type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
};

/**
 * Generic paginated table for admin list pages.
 *
 * Deliberately plain: columns describe what to show, the caller owns fetching
 * and filter state. Pagination is driven by DRF's `{count, next, previous}`
 * shape via page-number offsets rather than the opaque `next`/`previous` URLs,
 * so the caller only needs to track a page number.
 */
export function DataTable<T>({
  columns,
  rows,
  keyFor,
  loading,
  emptyMessage = "Ничего не найдено.",
  onRowClick,
  page,
  pageSize,
  count,
  onPageChange,
}: {
  columns: Column<T>[];
  rows: T[];
  keyFor: (row: T) => string | number;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  page: number;
  pageSize: number;
  count: number;
  onPageChange: (page: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(count / pageSize));

  return (
    <div className="border border-line">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-card">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-graphite ${col.className ?? ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-xs text-ash">
                  Загрузка…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-xs text-ash">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={keyFor(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`border-b border-line last:border-b-0 ${
                    onRowClick ? "cursor-pointer hover:bg-card" : ""
                  }`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 text-ink ${col.className ?? ""}`}>
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-line px-4 py-3">
        <p className="text-xs text-ash">
          {count === 0 ? "0 результатов" : `Страница ${page} из ${pageCount} · ${count} результатов`}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="cursor-pointer border border-line px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            Назад
          </button>
          <button
            type="button"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
            className="cursor-pointer border border-line px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            Далее
          </button>
        </div>
      </div>
    </div>
  );
}
