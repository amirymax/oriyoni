"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { ToastProvider } from "@/components/admin/Toast";
import { useAuth } from "@/context/AuthContext";

/**
 * Gates every `/admin/*` route behind `is_staff`.
 *
 * `AuthContext` is a client-side Context (it fetches `/api/auth/me/` from the
 * browser, and the session lives in an httpOnly cookie this layout cannot
 * read on the server), so the guard has to run client-side too, same as
 * `account/page.tsx`'s pattern: wait out "loading", then redirect once the
 * answer is known.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "guest") {
      router.replace("/login?next=/admin");
    } else if (status === "authenticated" && !user?.is_staff) {
      router.replace("/login?next=/admin");
    }
  }, [status, user, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <p className="text-sm text-graphite">Загрузка…</p>
      </div>
    );
  }

  if (status !== "authenticated" || !user?.is_staff) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <p className="text-sm text-graphite">Загрузка…</p>
      </div>
    );
  }

  return (
    <ToastProvider>
      <AdminShell>{children}</AdminShell>
    </ToastProvider>
  );
}
