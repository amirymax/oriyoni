"use client";

import { FlagGB, FlagRU } from "@/components/flags";
import { useLanguage } from "@/context/LanguageContext";
import { fmt, LANGUAGES, type Lang } from "@/lib/i18n";

const FLAGS: Record<Lang, typeof FlagGB> = {
  en: FlagGB,
  ru: FlagRU,
};

export function LanguageSwitcher({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { lang, setLang, t } = useLanguage();

  return (
    <div
      role="group"
      aria-label={t.langSwitchLabel}
      className={`flex items-center gap-0.5 rounded-full p-0.5 ${
        tone === "dark" ? "bg-white/10" : "bg-card"
      }`}
    >
      {LANGUAGES.map(({ id, endonym }) => {
        const Flag = FLAGS[id];
        const active = lang === id;

        return (
          <button
            key={id}
            type="button"
            onClick={() => setLang(id)}
            aria-pressed={active}
            title={endonym}
            aria-label={fmt(t.langSwitchTo, { lang: endonym })}
            className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition-opacity sm:w-9 ${
              active
                ? "opacity-100"
                : "opacity-45 hover:opacity-80 focus-visible:opacity-80"
            }`}
          >
            <Flag
              className={`h-3.5 w-5 rounded-[2px] ${
                active
                  ? tone === "dark"
                    ? "shadow-[0_0_0_1.5px_#ffffff]"
                    : "shadow-[0_0_0_1.5px_var(--color-ink)]"
                  : ""
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
