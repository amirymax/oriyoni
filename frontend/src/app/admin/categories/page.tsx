"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "@/components/admin/Modal";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { Field, FormError, SubmitButton } from "@/components/form";
import { ApiError } from "@/lib/api";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
  type CategoryAdmin,
  type CategoryAdminInput,
} from "@/lib/admin";

const PAGE_SIZE = 20;

export default function AdminCategoriesPage() {
  const [rows, setRows] = useState<CategoryAdmin[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryAdmin | null>(null);
  // Bumped on every open so the form below remounts with fresh state even
  // when re-opening the same category right after cancelling an edit.
  const [modalSession, setModalSession] = useState(0);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      try {
        const data = await listCategories({ search: search || undefined, page });
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
  }, [search, page]);

  function reload() {
    setLoading(true);
    return listCategories({ search: search || undefined, page })
      .then((data) => {
        setRows(data.results);
        setCount(data.count);
      })
      .finally(() => setLoading(false));
  }

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
    setModalSession((n) => n + 1);
  }

  function openEdit(category: CategoryAdmin) {
    setEditing(category);
    setModalOpen(true);
    setModalSession((n) => n + 1);
  }

  async function handleDelete(category: CategoryAdmin) {
    if (!window.confirm(`Удалить «${category.name_en}»?`)) return;
    setDeleteError(null);
    try {
      await deleteCategory(category.id);
      reload();
    } catch (caught) {
      setDeleteError(caught instanceof ApiError ? caught.message : "Не удалось удалить категорию.");
    }
  }

  const columns: Column<CategoryAdmin>[] = [
    { key: "name_en", header: "Название (EN)" },
    { key: "name_ru", header: "Название (RU)" },
    { key: "slug", header: "Slug" },
    { key: "position", header: "Позиция" },
    { key: "product_count", header: "Товаров" },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openEdit(row);
            }}
            className="cursor-pointer text-xs font-semibold uppercase tracking-[0.08em] text-ink underline underline-offset-4"
          >
            Изменить
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row);
            }}
            className="cursor-pointer text-xs font-semibold uppercase tracking-[0.08em] text-red-700 underline underline-offset-4"
          >
            Удалить
          </button>
        </div>
      ),
      className: "text-right",
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">Категории</h1>
        <button
          type="button"
          onClick={openCreate}
          className="cursor-pointer bg-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-white hover:opacity-85"
        >
          Новая категория
        </button>
      </div>

      <div className="mb-4">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Поиск категорий…"
          className="w-64 border border-line px-3 py-2 text-sm text-ink placeholder:text-ash focus:border-ink focus:outline-none"
        />
      </div>

      <FormError>{deleteError}</FormError>

      <div className="mt-4">
        <DataTable
          columns={columns}
          rows={rows}
          keyFor={(row) => row.id}
          loading={loading}
          emptyMessage="Категорий пока нет."
          page={page}
          pageSize={PAGE_SIZE}
          count={count}
          onPageChange={setPage}
        />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Изменить категорию" : "Новая категория"}>
        <CategoryForm
          key={modalSession}
          editing={editing}
          onSaved={() => {
            setModalOpen(false);
            reload();
          }}
        />
      </Modal>
    </div>
  );
}

function CategoryForm({
  editing,
  onSaved,
}: {
  editing: CategoryAdmin | null;
  onSaved: () => void;
}) {
  const [slug, setSlug] = useState(editing?.slug ?? "");
  const [nameEn, setNameEn] = useState(editing?.name_en ?? "");
  const [nameRu, setNameRu] = useState(editing?.name_ru ?? "");
  const [position, setPosition] = useState(editing ? String(editing.position) : "0");
  const [error, setError] = useState<ApiError | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const body: CategoryAdminInput = { slug, name_en: nameEn, name_ru: nameRu, position: Number(position) };

    try {
      if (editing) {
        await updateCategory(editing.id, body);
      } else {
        await createCategory(body);
      }
      onSaved();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught : new ApiError(0, "Не удалось сохранить категорию."));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <FormError>{error?.banner}</FormError>
      <Field id="cat_name_en" label="Название (EN)" value={nameEn} onChange={setNameEn} error={error?.field("name_en")} required />
      <Field id="cat_name_ru" label="Название (RU)" value={nameRu} onChange={setNameRu} error={error?.field("name_ru")} required />
      <Field id="cat_slug" label="Slug" value={slug} onChange={setSlug} error={error?.field("slug")} required />
      <Field
        id="cat_position"
        label="Позиция"
        type="number"
        value={position}
        onChange={setPosition}
        error={error?.field("position")}
      />
      <SubmitButton pending={pending} pendingLabel="Сохранение…">
        {editing ? "Сохранить изменения" : "Создать категорию"}
      </SubmitButton>
    </form>
  );
}
