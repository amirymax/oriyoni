"use client";

import { useState, type FormEvent } from "react";
import { CheckIcon } from "@/components/icons";
import { CrownMark } from "@/components/CrownMark";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  }

  return (
    <section className="bg-charcoal text-white">
      <div className="container-shell flex flex-col items-center py-16 text-center sm:py-20">
        <CrownMark className="h-8 w-8 text-champagne" />
        <h2 className="mt-5 font-display text-2xl font-bold uppercase tracking-tight sm:text-3xl">
          Join the Court
        </h2>
        <p className="mt-3 max-w-sm text-sm text-white/65">
          Get 10% off your first order and early access to new drops.
        </p>

        {submitted ? (
          <p className="mt-8 flex items-center gap-2 text-sm text-champagne">
            <CheckIcon className="h-4 w-4" />
            You&apos;re on the list — welcome to ORIYONI.
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row"
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full border border-white/25 bg-transparent px-4 py-3.5 text-sm text-white placeholder:text-white/45 focus:border-champagne focus:outline-none"
            />
            <button
              type="submit"
              className="shrink-0 cursor-pointer bg-white px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-ink transition-colors hover:bg-champagne"
            >
              Subscribe
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
