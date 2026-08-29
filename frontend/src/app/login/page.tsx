"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { AuthShell, Field, FormError, SubmitButton } from "@/components/form";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { ApiError } from "@/lib/api";

function LoginForm() {
  const { t } = useLanguage();
  const { signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<ApiError | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      await signIn(email, password);
      // Back where they were headed before the sign-in wall, or the account.
      router.push(searchParams.get("next") ?? "/account");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught : new ApiError(0, t.authOffline)
      );
      setPending(false);
    }
  }

  return (
    <AuthShell
      title={t.authSignInTitle}
      description={t.authSignInDescription}
      footer={
        <div className="flex flex-col gap-2">
          <span>
            {t.authSignInPrompt}{" "}
            <Link href="/register" className="text-ink underline underline-offset-4">
              {t.authSignInPromptLink}
            </Link>
          </span>
          <Link href="/forgot-password" className="text-ink underline underline-offset-4">
            {t.authForgotPassword}
          </Link>
        </div>
      }
    >
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
        <Field
          id="password"
          label={t.authPassword}
          type="password"
          value={password}
          onChange={setPassword}
          error={error?.field("password")}
          autoComplete="current-password"
          required
        />

        <SubmitButton pending={pending} pendingLabel={t.authWorking}>
          {t.authSignInSubmit}
        </SubmitButton>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  // useSearchParams needs a Suspense boundary to keep the route from
  // opting the whole page into client-side rendering.
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
