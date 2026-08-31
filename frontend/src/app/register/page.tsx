"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { AuthShell, Field, FormError, SubmitButton } from "@/components/form";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { ApiError } from "@/lib/api";

function RegisterForm() {
  const { t, lang } = useLanguage();
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<ApiError | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      // Registering signs you in, so there is no second step here. A
      // confirmation email goes out in the background; the account page nudges
      // about it until the link is followed.
      await register({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        language: lang,
      });
      // Sent back where they came from when the storefront asked them to
      // sign up mid-task — abandoning a half-finished checkout to land on
      // the account page is how a prompt to register loses an order.
      router.push(searchParams.get("next") ?? "/account");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught : new ApiError(0, t.authOffline));
      setPending(false);
    }
  }

  return (
    <AuthShell
      title={t.authRegisterTitle}
      description={t.authRegisterDescription}
      footer={
        <span>
          {t.authRegisterPrompt}{" "}
          <Link href="/login" className="text-ink underline underline-offset-4">
            {t.authRegisterPromptLink}
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <FormError>{error?.banner}</FormError>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field
            id="first_name"
            label={t.authFirstName}
            value={firstName}
            onChange={setFirstName}
            error={error?.field("first_name")}
            autoComplete="given-name"
            autoFocus
          />
          <Field
            id="last_name"
            label={t.authLastName}
            value={lastName}
            onChange={setLastName}
            error={error?.field("last_name")}
            autoComplete="family-name"
          />
        </div>

        <Field
          id="email"
          label={t.authEmail}
          type="email"
          value={email}
          onChange={setEmail}
          error={error?.field("email")}
          autoComplete="email"
          required
        />
        <Field
          id="password"
          label={t.authPassword}
          type="password"
          value={password}
          onChange={setPassword}
          error={error?.field("password")}
          autoComplete="new-password"
          required
        />

        <SubmitButton pending={pending} pendingLabel={t.authWorking}>
          {t.authRegisterSubmit}
        </SubmitButton>
      </form>
    </AuthShell>
  );
}

export default function RegisterPage() {
  // useSearchParams opts the route into client-side rendering, which Next
  // requires a Suspense boundary for.
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
