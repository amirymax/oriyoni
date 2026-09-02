"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  dictionaries,
  formatPrice as formatPriceRaw,
  loc,
  plural as pluralRaw,
  type Dict,
  type Lang,
  type Localized,
} from "@/lib/i18n";

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Dictionary for the active language. */
  t: Dict;
  /** Resolve a localized value (product name, colour, …). */
  l: <T>(value: Localized<T>) => T;
  /** Format a ruble price for the active locale. */
  price: (value: number) => string;
  /** Count with the correct plural form for the active language. */
  count: (n: number) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);
const STORAGE_KEY = "oriyoni-lang-v1";

function isLang(value: unknown): value is Lang {
  return value === "en" || value === "ru";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // ignore unavailable storage
    }

    const next = isLang(stored)
      ? stored
      : navigator.language.toLowerCase().startsWith("ru")
        ? "ru"
        : "en";

    if (next !== "en") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage / navigator, unavailable during SSR
      setLangState(next);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore unavailable storage
    }
  }, []);

  const value = useMemo<LanguageContextValue>(() => {
    const t = dictionaries[lang];
    return {
      lang,
      setLang,
      t,
      l: (value) => loc(value, lang),
      price: (value) => formatPriceRaw(value, lang),
      count: (n) => pluralRaw(t, lang, n),
    };
  }, [lang, setLang]);

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
