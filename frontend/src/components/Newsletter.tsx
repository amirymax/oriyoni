"use client";

import { useState, type FormEvent } from "react";
import { CheckIcon } from "@/components/icons";
import { CrownMark } from "@/components/CrownMark";
import { useLanguage } from "@/context/LanguageContext";
import { ApiError, api } from "@/lib/api";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const { t, lang } = useLanguage();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setPending(true);
    setError(null);

    try {
      // The reading language goes up too, so the shop knows which one to
      // write back in.
      await api("/api/newsletter/", {
        method: "POST",
        body: { email: email.trim(), language: lang },
      });
      setSubmitted(true);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? (caught.field("email") ?? caught.message)
          : t.authOffline
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="bg-charcoal text-white">
      <div className="container-shell flex flex-col items-center py-16 text-center sm:py-20">
        <CrownMark className="h-8 w-8 text-champagne" aria-hidden="true" />
        <h2 className="mt-5 font-display text-2xl font-bold uppercase tracking-tight sm:text-3xl">
          {t.newsletterHeading}
        </h2>
        <p className="mt-3 max-w-sm text-sm text-white/65">{t.newsletterCopy}</p>

        {submitted ? (
          <p className="mt-8 flex items-center gap-2 text-sm text-champagne">
            <CheckIcon className="h-4 w-4" aria-hidden="true" />
            {t.newsletterSuccess}
          </p>
        ) : (
          <>
            <form
              onSubmit={handleSubmit}
              className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row"
            >
              <label htmlFor="newsletter-email" className="sr-only">
                {t.newsletterEmailLabel}
              </label>
              <input
                id="newsletter-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.newsletterPlaceholder}
                className="w-full border border-white/25 bg-transparent px-4 py-3.5 text-sm text-white placeholder:text-white/45 focus:border-champagne focus:outline-none"
              />
              <button
                type="submit"
                disabled={pending}
                className="shrink-0 cursor-pointer bg-white px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-ink transition-colors hover:bg-champagne disabled:cursor-wait disabled:opacity-70"
              >
                {pending ? t.authWorking : t.newsletterSubmit}
              </button>
            </form>

            {error ? (
              <p role="alert" className="mt-3 text-sm text-champagne">
                {error}
              </p>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
