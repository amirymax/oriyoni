"use client";

import { useState, type FormEvent } from "react";
import { CheckIcon } from "@/components/icons";
import { PageHeader } from "@/components/PageHeader";
import { useLanguage } from "@/context/LanguageContext";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const { t } = useLanguage();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
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
              <p className="mt-2">support@oriyoni.com</p>
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
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field
                    id="name"
                    label={t.contactName}
                    type="text"
                    autoComplete="name"
                    required
                  />
                  <Field
                    id="email"
                    label={t.contactEmail}
                    type="email"
                    autoComplete="email"
                    required
                  />
                </div>
                <Field id="subject" label={t.contactSubject} type="text" />
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
                    className="w-full resize-none border border-line px-3.5 py-3 text-sm text-ink placeholder:text-ash focus:border-ink focus:outline-none"
                    placeholder={t.contactMessagePlaceholder}
                  />
                </div>
                <button
                  type="submit"
                  className="cursor-pointer bg-ink px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-charcoal"
                >
                  {t.contactSubmit}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function Field({
  id,
  label,
  type,
  required,
  autoComplete,
}: {
  id: string;
  label: string;
  type: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-ink"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="w-full border border-line px-3.5 py-3 text-sm text-ink placeholder:text-ash focus:border-ink focus:outline-none"
      />
    </div>
  );
}
