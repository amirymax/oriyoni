"use client";

import { useState, type FormEvent } from "react";
import { CheckIcon } from "@/components/icons";
import { PageHeader } from "@/components/PageHeader";
import { Field, FormError } from "@/components/form";
import { useLanguage } from "@/context/LanguageContext";
import { ApiError, api } from "@/lib/api";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [error, setError] = useState<ApiError | null>(null);
  const [pending, setPending] = useState(false);
  const { t, lang } = useLanguage();

  function set(field: keyof typeof form) {
    return (value: string) => setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    try {
      await api("/api/contact/", { method: "POST", body: { ...form, language: lang } });
      setSubmitted(true);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught : new ApiError(0, t.authOffline));
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <PageHeader title={t.contactTitle} description={t.contactDescription} />
      <div className="container-shell py-10 sm:py-14">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-6 text-sm text-graphite">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-ink">
                {t.contactEmailHeading}
              </h2>
              <p className="mt-2">support@oriyoni.shop</p>
            </div>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-ink">
                {t.contactResponseHeading}
              </h2>
              <p className="mt-2">{t.contactResponseCopy}</p>
            </div>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-ink">
                {t.contactWholesaleHeading}
              </h2>
              <p className="mt-2">{t.contactWholesaleCopy}</p>
            </div>
          </div>

          <div>
            {submitted ? (
              <div className="flex flex-col items-start gap-3 border border-line p-8">
                <CheckIcon className="h-6 w-6 text-champagne-ink" aria-hidden="true" />
                <p className="text-sm text-ink">{t.contactSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <FormError>{error?.banner}</FormError>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field
                    id="name"
                    label={t.contactName}
                    value={form.name}
                    onChange={set("name")}
                    error={error?.field("name")}
                    autoComplete="name"
                    required
                  />
                  <Field
                    id="email"
                    label={t.contactEmail}
                    type="email"
                    value={form.email}
                    onChange={set("email")}
                    error={error?.field("email")}
                    autoComplete="email"
                    required
                  />
                </div>
                <Field
                  id="subject"
                  label={t.contactSubject}
                  value={form.subject}
                  onChange={set("subject")}
                  error={error?.field("subject")}
                />
                <div>
                  <label
                    htmlFor="message"
                    className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-ink"
                  >
                    {t.contactMessage}
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => set("message")(e.target.value)}
                    aria-invalid={error?.field("message") ? true : undefined}
                    className="w-full resize-none border border-line px-3.5 py-3 text-sm text-ink placeholder:text-ash focus:border-ink focus:outline-none"
                    placeholder={t.contactMessagePlaceholder}
                  />
                  {error?.field("message") ? (
                    <p className="mt-1.5 text-xs text-red-700">{error.field("message")}</p>
                  ) : null}
                </div>
                <button
                  type="submit"
                  disabled={pending}
                  className="cursor-pointer bg-ink px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-charcoal disabled:cursor-wait disabled:opacity-60"
                >
                  {pending ? t.authWorking : t.contactSubmit}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
