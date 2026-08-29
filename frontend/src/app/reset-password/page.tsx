"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { AuthShell, Field, FormError, FormNotice, SubmitButton } from "@/components/form";
import { useLanguage } from "@/context/LanguageContext";
import { ApiError, api } from "@/lib/api";

function ResetForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  // The emailed link carries these; without them there is nothing to confirm.
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      await api("/api/auth/password/reset/confirm/", {
        method: "POST",
        body: { uid, token, new_password: password },
      });
      // Confirming signs them in, so send them on rather than to the login form.
      setDone(true);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught : new ApiError(0, t.authOffline));
    } finally {
      setPending(false);
    }
  }

  if (!uid || !token) {
    return (
      <AuthShell
        title={t.authResetTitle}
        description={t.authResetDescription}
        footer={
          <Link href="/forgot-password" className="text-ink underline underline-offset-4">
            {t.authForgotSubmit}
          </Link>
        }
      >
        <FormError>{t.authResetInvalid}</FormError>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t.authResetTitle}
      description={t.authResetDescription}
      footer={
        done ? (
          <Link href="/account" className="text-ink underline underline-offset-4">
            {t.authAccount}
          </Link>
        ) : (
          <Link href="/login" className="text-ink underline underline-offset-4">
            {t.authSignIn}
          </Link>
        )
      }
    >
      {done ? (
        <FormNotice>{t.authResetDone}</FormNotice>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <FormError>
            {error?.field("token") ? t.authResetInvalid : error?.banner}
          </FormError>

          <Field
            id="new_password"
            label={t.authResetNewPassword}
            type="password"
            value={password}
            onChange={setPassword}
            error={error?.field("new_password")}
            autoComplete="new-password"
            autoFocus
            required
          />

          <SubmitButton pending={pending} pendingLabel={t.authWorking}>
            {t.authResetSubmit}
          </SubmitButton>
        </form>
      )}
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
