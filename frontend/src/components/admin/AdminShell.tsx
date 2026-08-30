"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

const NAV_ITEMS = [
  { href: "/admin", label: "Дашборд" },
  { href: "/admin/products", label: "Товары" },
  { href: "/admin/categories", label: "Категории" },
  { href: "/admin/orders", label: "Заказы" },
  { href: "/admin/users", label: "Пользователи" },
  { href: "/admin/analytics", label: "Аналитика" },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="shrink-0 border-b border-line bg-white lg:w-60 lg:border-b-0 lg:border-r">
        <div className="border-b border-line px-6 py-5">
          <Link href="/admin" className="eyebrow text-xs text-ink">
            Oriyoni
          </Link>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ash">
            Админ-панель
          </p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 py-3 lg:flex-col lg:gap-0.5 lg:overflow-visible">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] transition-colors ${
                isActive(item.href) ? "bg-ink text-white" : "text-graphite hover:bg-card"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-line bg-white px-6 py-4">
          <p className="truncate text-xs text-ash">{user?.email}</p>
          <button
            type="button"
            onClick={async () => {
              await signOut();
              router.push("/login");
            }}
            className="shrink-0 cursor-pointer text-xs font-semibold uppercase tracking-[0.1em] text-ink underline underline-offset-4"
          >
            Выйти
          </button>
        </header>
        <main className="flex-1 bg-paper px-6 py-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
