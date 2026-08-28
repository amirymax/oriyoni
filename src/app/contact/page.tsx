"use client";

import { useState, type FormEvent } from "react";
import { CheckIcon } from "@/components/icons";
import { PageHeader } from "@/components/PageHeader";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <>
      <PageHeader
        title="Contact Us"
        description="Questions about an order, sizing, or wholesale? Reach out below."
      />
      <div className="container-shell py-10 sm:py-14">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-6 text-sm text-graphite">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-ink">
                Email
              </h2>
              <p className="mt-2">support@oriyoni.com</p>
            </div>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-ink">
                Response Time
              </h2>
              <p className="mt-2">We reply within 1–2 business days.</p>
            </div>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-ink">
                Wholesale
              </h2>
              <p className="mt-2">
                Interested in stocking ORIYONI? Mention it in your message.
              </p>
            </div>
          </div>

          <div>
            {submitted ? (
              <div className="flex flex-col items-start gap-3 border border-line p-8">
                <CheckIcon className="h-6 w-6 text-champagne-ink" />
                <p className="text-sm text-ink">
                  Thanks — your message has been noted. We&apos;ll get back to
                  you shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field id="name" label="Name" type="text" required />
                  <Field id="email" label="Email" type="email" required />
                </div>
                <Field id="subject" label="Subject" type="text" />
                <div>
                  <label
                    htmlFor="message"
                    className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-ink"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    className="w-full resize-none border border-line px-3.5 py-3 text-sm text-ink placeholder:text-ash focus:border-ink focus:outline-none"
                    placeholder="How can we help?"
                  />
                </div>
                <button
                  type="submit"
                  className="cursor-pointer bg-ink px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-charcoal"
                >
                  Send Message
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
}: {
  id: string;
  label: string;
  type: string;
  required?: boolean;
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
        className="w-full border border-line px-3.5 py-3 text-sm text-ink placeholder:text-ash focus:border-ink focus:outline-none"
      />
    </div>
  );
}
