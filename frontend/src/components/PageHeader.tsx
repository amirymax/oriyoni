"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export function PageHeader({
  title,
  crumb,
  description,
}: {
  title: string;
  crumb?: string;
  description?: string;
}) {
  const { t } = useLanguage();

  return (
    <div className="border-b border-line bg-white">
      <div className="container-shell py-10 sm:py-14">
        <nav aria-label="Breadcrumb" className="text-xs text-ash">
          <Link href="/" className="hover:text-ink">
            {t.breadcrumbHome}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ink">{crumb ?? title}</span>
        </nav>
        <h1 className="mt-3 font-display text-3xl font-bold uppercase tracking-tight text-ink sm:text-4xl">
          {title}
        </h1>
        {description && <p className="mt-3 max-w-xl text-sm text-ash">{description}</p>}
      </div>
    </div>
  );
}
