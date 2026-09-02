"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Badge } from "@/components/Badge";
import { FormError, FormNotice } from "@/components/form";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import {
  formatMoney,
  getUser,
  updateUser,
  type OrderStatus,
  type UserDetailAdmin,
} from "@/lib/admin";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Ожидает оплаты",
  paid: "Оплачен",
  shipped: "Отправлен",
  delivered: "Доставлен",
  cancelled: "Отменён",
};

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const userId = Number(id);
  const { user: currentUser } = useAuth();

  const [user, setUser] = useState<UserDetailAdmin | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [pendingField, setPendingField] = useState<"is_active" | "is_staff" | null>(null);

  useEffect(() => {
    let cancelled = false;
    getUser(userId)
      .then((data) => !cancelled && setUser(data))
      .catch((caught) => !cancelled && setLoadError(caught instanceof ApiError ? caught.message : "Не удалось загрузить пользователя."));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function handleToggle(field: "is_active" | "is_staff", value: boolean) {
    if (!user) return;
    setPendingField(field);
    setToggleError(null);
    setSaved(null);
    try {
      const updated = await updateUser(user.id, { [field]: value });
      setUser(updated);
      setSaved("Сохранено.");
    } catch (caught) {
      setToggleError(caught instanceof ApiError ? caught.message : "Не удалось обновить пользователя.");
    } finally {
      setPendingField(null);
    }
  }

  if (loadError) return <p className="text-sm text-red-700">{loadError}</p>;
  if (!user) return <p className="text-sm text-graphite">Загрузка…</p>;

  const isSelf = currentUser?.id === user.id;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">
          {[user.first_name, user.last_name].filter(Boolean).join(" ") || user.email}
        </h1>
        <p className="mt-1 text-xs text-ash">
          {user.email} · регистрация: {new Date(user.created_at).toLocaleDateString("ru-RU")}
        </p>
      </div>

      <FormError>{toggleError}</FormError>
      {saved ? <FormNotice>{saved}</FormNotice> : null}

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <label className="flex items-center justify-between border border-line px-4 py-4">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-ink">Аккаунт активен</span>
          <input
            type="checkbox"
            checked={user.is_active}
            disabled={pendingField === "is_active"}
            onChange={(e) => handleToggle("is_active", e.target.checked)}
            className="h-5 w-5"
          />
        </label>
        <label
          className={`flex items-center justify-between border border-line px-4 py-4 ${
            isSelf ? "opacity-50" : ""
          }`}
          title={isSelf ? "Вы не можете снять права администратора с самого себя." : undefined}
        >
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-ink">Права администратора</span>
          <input
            type="checkbox"
            checked={user.is_staff}
            disabled={pendingField === "is_staff" || isSelf}
            onChange={(e) => handleToggle("is_staff", e.target.checked)}
            className="h-5 w-5"
          />
        </label>
      </section>

      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.1em] text-ink">История заказов</h2>
        {user.orders.length === 0 ? (
          <p className="text-sm text-graphite">Заказов пока нет.</p>
        ) : (
          <div className="overflow-x-auto border border-line">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line bg-card text-xs font-semibold uppercase tracking-[0.08em] text-graphite">
                  <th className="px-4 py-3 text-left">Заказ</th>
                  <th className="px-4 py-3 text-left">Статус</th>
                  <th className="px-4 py-3 text-right">Сумма</th>
                  <th className="px-4 py-3 text-left">Дата</th>
                </tr>
              </thead>
              <tbody>
                {user.orders.map((order) => (
                  <tr key={order.id} className="border-b border-line last:border-b-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-ink underline underline-offset-4"
                      >
                        {order.number}
                      </Link>
                    </td>
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
