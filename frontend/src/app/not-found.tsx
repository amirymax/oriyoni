"use client";

import Link from "next/link";
import { CrownMark } from "@/components/CrownMark";
import { useLanguage } from "@/context/LanguageContext";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="container-shell flex flex-col items-center py-32 text-center">
      <CrownMark className="h-12 w-12 text-ink/30" aria-hidden="true" />
      <h1 className="mt-6 font-display text-3xl font-bold uppercase tracking-tight text-ink">
        {t.notFoundTitle}
      </h1>
      <p className="mt-3 max-w-sm text-sm text-ash">{t.notFoundCopy}</p>
      <Link
        href="/"
        className="mt-8 cursor-pointer bg-ink px-7 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white"
      >
        {t.notFoundCta}
      </Link>
    </div>
  );
}
