"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { CloseIcon } from "@/components/icons";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

// Remembered per browsing session rather than forever. Reappearing on every
// visit to checkout would be nagging; never showing again would mean someone
// who dismissed it once in passing can never be offered it a second time.
const DISMISSED_KEY = "oriyoni:guest-checkout-prompt-dismissed";

function readDismissed() {
  try {
    return sessionStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    // Private browsing and blocked site data both throw on access. Not being
    // able to tell is the same as not dismissed.
    return false;
  }
}

// Nothing outside this tab writes the key, so there is nothing to subscribe to.
const noSubscribe = () => () => {};

/**
 * Offers a guest an account when they reach checkout.
 *
 * Deliberately not a gate: guest checkout still works, and "continue as guest"
 * sits alongside the other two actions rather than hidden beneath them.
 * Signing up here keeps the bag — the API folds a guest cart into the account
 * on sign-in — so nobody loses what they were part-way through buying.
 */
export function GuestCheckoutPrompt() {
  const { t } = useLanguage();
  const { status } = useAuth();

  // sessionStorage cannot be read while the page is prerendered, and reading
  // it in an effect would mean rendering the modal and then closing it a frame
  // later. useSyncExternalStore exists for exactly this: the server snapshot
  // is "dismissed", so the prerendered HTML has it shut, and the client reads
  // the real value without a flash or a hydration mismatch.
  const dismissedEarlier = useSyncExternalStore(noSubscribe, readDismissed, () => true);
  const [dismissedNow, setDismissedNow] = useState(false);

  // Waits for "guest" rather than for "not authenticated": the session is only
  // known after the first call to the API, so treating the loading state as
  // signed-out would flash this at people who are already signed in.
  const open = status === "guest" && !dismissedEarlier && !dismissedNow;

  const dismiss = useCallback(() => {
    setDismissedNow(true);
    try {
      sessionStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Nothing to do — it is closed either way, and will simply be offered
      // again the next time this page loads.
    }
  }, []);

  // Escape closes it, matching the scrim and the close button.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") dismiss();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, dismiss]);

  // Hold the page still underneath, so the panel is the only thing moving.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Both routes come back here rather than going to the account page, so a
  // half-finished order is not abandoned by the act of signing up for one.
  const next = encodeURIComponent("/checkout");

  return (
    // Stays mounted so the closing transition has something to animate;
    // `inert` keeps it out of tab order and the accessibility tree while shut.
    <div className="modal-root" data-open={open} inert={!open}>
      <button
        aria-label={t.guestPromptDismiss}
        tabIndex={open ? undefined : -1}
        onClick={dismiss}
        className="modal-scrim cursor-pointer"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-prompt-title"
        className="modal-panel w-full max-w-md border border-line bg-white"
      >
        <div className="flex items-start justify-between border-b border-line px-6 py-5">
          <h2
            id="guest-prompt-title"
            className="text-sm font-semibold uppercase tracking-[0.1em] text-ink"
          >
            {t.guestPromptTitle}
          </h2>
          <button
            type="button"
            onClick={dismiss}
            aria-label={t.guestPromptDismiss}
            tabIndex={open ? undefined : -1}
            className="-mr-1 cursor-pointer p-1 text-ink"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 px-6 py-6">
          <p className="text-sm leading-relaxed text-graphite">{t.guestPromptBody}</p>

          <div className="space-y-3">
            <Link
              href={`/register?next=${next}`}
              tabIndex={open ? undefined : -1}
              className="block cursor-pointer bg-ink px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-[0.12em] text-white transition-opacity hover:opacity-85"
            >
              {t.guestPromptCreate}
            </Link>
            <Link
              href={`/login?next=${next}`}
              tabIndex={open ? undefined : -1}
              className="block cursor-pointer border border-line px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-[0.12em] text-ink transition-colors hover:border-ink"
            >
              {t.guestPromptSignIn}
            </Link>
            <button
              type="button"
              onClick={dismiss}
              tabIndex={open ? undefined : -1}
              className="block w-full cursor-pointer px-6 py-2 text-center text-xs text-graphite underline underline-offset-4"
            >
              {t.guestPromptContinue}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
