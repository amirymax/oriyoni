"use client";

import { useLanguage } from "@/context/LanguageContext";
import { fmt, LANGUAGES } from "@/lib/i18n";

export function LanguageSwitcher({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { lang, setLang, t } = useLanguage();

  return (
    <div
      role="group"
      aria-label={t.langSwitchLabel}
      className={`flex w-fit items-center gap-0.5 rounded-full p-0.5 ${
        tone === "dark" ? "bg-white/10" : "bg-card"
      }`}
    >
      {LANGUAGES.map(({ id, endonym, short }) => {
        const active = lang === id;

        return (
          <button
            key={id}
            type="button"
            onClick={() => setLang(id)}
            aria-pressed={active}
            title={endonym}
            aria-label={fmt(t.langSwitchTo, { lang: endonym })}
            className={`flex h-7 min-w-8 cursor-pointer items-center justify-center rounded-full px-1.5 text-[11px] sm:min-w-9 sm:px-2 font-semibold tracking-[0.06em] transition-[background-color,color,opacity] ${
              active
                ? tone === "dark"
                  ? "bg-white/25 text-white opacity-100"
                  : "bg-white text-ink opacity-100"
                : tone === "dark"
                  ? "text-white opacity-55 hover:opacity-90 focus-visible:opacity-90"
                  : "text-ink opacity-45 hover:opacity-80 focus-visible:opacity-80"
            }`}
          >
            {short}
          </button>
        );
      })}
    </div>
  );
}
