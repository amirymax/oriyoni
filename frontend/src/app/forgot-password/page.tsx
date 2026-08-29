"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthShell, Field, FormError, FormNotice, SubmitButton } from "@/components/form";
import { useLanguage } from "@/context/LanguageContext";
import { ApiError, api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const { t, lang } = useLanguage();

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      // The API answers the same whether or not the address has an account,
      // so this screen must not imply it found one either.
      await api("/api/auth/password/reset/", {
        method: "POST",
        body: { email, language: lang },
      });
      setSent(true);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught : new ApiError(0, t.authOffline));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell
      title={t.authForgotTitle}
      description={t.authForgotDescription}
      footer={
        <Link href="/login" className="text-ink underline underline-offset-4">
          {t.authSignIn}
        </Link>
      }
    >
      {sent ? (
        <FormNotice>{t.authForgotSent}</FormNotice>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <FormError>{error?.banner}</FormError>

          <Field
            id="email"
            label={t.authEmail}
            type="email"
            value={email}
            onChange={setEmail}
            error={error?.field("email")}
            autoComplete="email"
            autoFocus
            required
          />

          <SubmitButton pending={pending} pendingLabel={t.authWorking}>
            {t.authForgotSubmit}
          </SubmitButton>
        </form>
      )}
    </AuthShell>
  );
}
