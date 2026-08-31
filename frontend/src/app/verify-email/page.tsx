"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { AuthShell, FormError, FormNotice, SubmitButton } from "@/components/form";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { ApiError, api } from "@/lib/api";

type State = "working" | "done" | "failed";

function VerifyEmail() {
  const { t, lang } = useLanguage();
  const { user, refreshUser } = useAuth();
  const searchParams = useSearchParams();

  // The emailed link carries these; without them there is nothing to confirm.
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  const [state, setState] = useState<State>(uid && token ? "working" : "failed");
  const [resent, setResent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  // Confirming needs nothing from the visitor, so it happens on arrival rather
  // than behind a button. The guard is for React's development double-render:
  // the link is single-use, so posting it twice would fail the second time and
  // report a working link as broken.
  const submitted = useRef(false);

  useEffect(() => {
    if (!uid || !token || submitted.current) return;
    submitted.current = true;

    api("/api/auth/email/verify/", { method: "POST", body: { uid, token } })
      .then(async () => {
        await refreshUser();
        setState("done");
      })
      .catch(async () => {
        // A link that was already followed fails the same way as a bad one, so
        // ask the API which it was rather than telling a confirmed shopper
        // their address is not confirmed.
        const me = await refreshUser();
        setState(me?.email_verified ? "done" : "failed");
      });
  }, [uid, token, refreshUser]);

  const resend = useCallback(async () => {
    // Only a signed-in visitor has an address to resend to; anyone else has to
    // sign in first, which the footer offers.
    if (!user) return;
    setPending(true);
    setError(null);

    try {
      await api("/api/auth/email/verify/resend/", {
        method: "POST",
        body: { email: user.email, language: lang },
      });
      setResent(true);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught : new ApiError(0, t.authOffline));
    } finally {
      setPending(false);
    }
  }, [user, lang, t.authOffline]);

  return (
    <AuthShell
      title={t.authVerifyTitle}
      description={t.authVerifyDescription}
      footer={
        <Link href={user ? "/account" : "/login"} className="text-ink underline underline-offset-4">
          {user ? t.authAccount : t.authSignIn}
        </Link>
      }
    >
      {state === "working" ? <FormNotice>{t.authWorking}</FormNotice> : null}

      {state === "done" ? <FormNotice>{t.authVerifyDone}</FormNotice> : null}

      {state === "failed" ? (
        <div className="space-y-5">
          <FormError>{t.authVerifyInvalid}</FormError>
          {resent ? <FormNotice>{t.authVerifyResent}</FormNotice> : null}
          {error ? <FormError>{error.banner ?? error.message}</FormError> : null}

          {user && !resent ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void resend();
              }}
            >
              <SubmitButton pending={pending} pendingLabel={t.authWorking}>
                {t.authVerifyResend}
              </SubmitButton>
            </form>
          ) : null}
        </div>
      ) : null}
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  // useSearchParams opts the route into client-side rendering, which Next
  // requires a Suspense boundary for.
  return (
    <Suspense fallback={null}>
      <VerifyEmail />
    </Suspense>
  );
}
