"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { api } from "@/lib/api";

/**
 * The nudge shown to a shopper who has not followed their confirmation link.
 *
 * Confirming is not a gate — the account works either way — so this is a line
 * of text with a button, not a wall in front of the page.
 */
export function VerifyEmailNotice() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();

  const [sent, setSent] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState(false);

  const resend = useCallback(async () => {
    if (!user) return;
    setPending(true);
    setFailed(false);

    try {
      await api("/api/auth/email/verify/resend/", {
        method: "POST",
        body: { email: user.email, language: lang },
      });
      // The API answers the same whether or not it actually sent anything, so
      // this message has to be as vague as the endpoint is.
      setSent(true);
    } catch {
      // Not folded into the success message: being rate limited or offline
      // means no email is coming, and saying one is on its way leaves the
      // shopper waiting for it.
      setFailed(true);
    } finally {
      setPending(false);
    }
  }, [user, lang]);

  if (!user || user.email_verified) return null;

  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-4 border border-line bg-card px-5 py-4"
    >
      <p className={`text-sm ${failed ? "text-red-800" : "text-graphite"}`}>
        {sent ? t.authVerifyResent : failed ? t.authGenericError : t.authVerifyBanner}
      </p>
      {sent ? null : (
        <button
          type="button"
          onClick={() => void resend()}
          disabled={pending}
          className="cursor-pointer text-xs font-semibold uppercase tracking-[0.12em] text-ink underline underline-offset-4 disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? t.authWorking : t.authVerifyBannerAction}
        </button>
      )}
    </div>
  );
}
