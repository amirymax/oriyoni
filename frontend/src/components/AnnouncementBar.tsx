"use client";

import { useState } from "react";
import { CloseIcon } from "@/components/icons";
import { useLanguage } from "@/context/LanguageContext";

export function AnnouncementBar() {
  const [visible, setVisible] = useState(true);
  const { t } = useLanguage();

  if (!visible) return null;

  return (
    <div
      className="relative bg-ink text-white"
      style={{ viewTransitionName: "site-announcement" }}
    >
      <div className="container-shell flex items-center justify-center py-2.5 text-center text-[11px] font-medium uppercase tracking-[0.12em] sm:text-xs">
        <p>
          {t.announcePromo} <span className="text-champagne">CROWN10</span>
          <span className="mx-2 hidden sm:inline">·</span>
          <span className="hidden sm:inline">{t.announceShipping}</span>
        </p>
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label={t.announceDismiss}
          className="absolute right-4 cursor-pointer text-white/70 transition-colors hover:text-white"
        >
          <CloseIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
