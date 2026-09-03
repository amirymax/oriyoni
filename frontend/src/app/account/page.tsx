"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { PageHeader } from "@/components/PageHeader";
import { VerifyEmailNotice } from "@/components/VerifyEmailNotice";
import { Field, FormError, FormNotice, SubmitButton } from "@/components/form";
import { Thumbnail } from "@/components/Thumbnail";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { ApiError, api, type Order, type Paginated } from "@/lib/api";
import { fmt } from "@/lib/i18n";

export default function AccountPage() {
  const { t } = useLanguage();
  const { user, status, signOut } = useAuth();
  const router = useRouter();

  const hadSession = useRef(false);

  // The session is only known after the first call to the API, so a signed-in
  // shopper must not be bounced to the login form while that is in flight.
  // Nor should someone who just pressed Sign Out: they are already on their
  // way to the home page, and redirecting them to a login form reads as the
  // site refusing to let them leave.
  useEffect(() => {
    if (status === "authenticated") {
      hadSession.current = true;
    } else if (status === "guest" && !hadSession.current) {
      router.replace("/login?next=/account");
    }
  }, [status, router]);

  if (status !== "authenticated" || !user) {
    return (
      <div className="container-shell py-20 text-sm text-graphite">{t.authWorking}</div>
    );
  }

  return (
    <>
      <PageHeader title={t.authAccountTitle} description={t.authAccountDescription} />
      <div className="container-shell space-y-14 py-10 sm:py-14">
        <VerifyEmailNotice />

        <div className="flex flex-wrap items-center justify-between gap-4 border border-line px-5 py-4">
          <p className="text-sm text-graphite">
            {fmt(t.authSignedInAs, { email: user.email })}
          </p>
          <button
            type="button"
            onClick={async () => {
              await signOut();
              router.push("/");
              router.refresh();
            }}
            className="cursor-pointer text-xs font-semibold uppercase tracking-[0.12em] text-ink underline underline-offset-4"
          >
            {t.authSignOut}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <DetailsForm />
          <PasswordForm />
        </div>

        <OrderHistory />
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-ink">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function DetailsForm() {
  const { t } = useLanguage();
  const { user, updateProfile } = useAuth();

  const [firstName, setFirstName] = useState(user?.first_name ?? "");
  const [lastName, setLastName] = useState(user?.last_name ?? "");
  const [error, setError] = useState<ApiError | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSaved(false);

    try {
      await updateProfile({ first_name: firstName, last_name: lastName });
      setSaved(true);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught : new ApiError(0, t.authOffline));
    } finally {
      setPending(false);
    }
  }

  return (
    <Section title={t.authAccountDetails}>
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <FormError>{error?.banner}</FormError>
        {saved ? <FormNotice>{t.authAccountSaved}</FormNotice> : null}

        <Field
          id="account_first_name"
          label={t.authFirstName}
          value={firstName}
          onChange={setFirstName}
          error={error?.field("first_name")}
          autoComplete="given-name"
        />
        <Field
          id="account_last_name"
          label={t.authLastName}
          value={lastName}
          onChange={setLastName}
          error={error?.field("last_name")}
          autoComplete="family-name"
        />

        <SubmitButton pending={pending} pendingLabel={t.authWorking}>
          {t.authAccountSave}
        </SubmitButton>
      </form>
    </Section>
  );
}

function PasswordForm() {
  const { t } = useLanguage();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState<ApiError | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSaved(false);

    try {
      await api("/api/auth/password/change/", {
        method: "POST",
        body: { current_password: current, new_password: next },
      });
      setSaved(true);
      setCurrent("");
      setNext("");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught : new ApiError(0, t.authOffline));
    } finally {
      setPending(false);
    }
  }

  return (
    <Section title={t.authAccountPassword}>
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <FormError>{error?.banner}</FormError>
        {saved ? <FormNotice>{t.authAccountPasswordSaved}</FormNotice> : null}

        <Field
          id="current_password"
          label={t.authAccountCurrentPassword}
          type="password"
          value={current}
          onChange={setCurrent}
          error={error?.field("current_password")}
          autoComplete="current-password"
          required
        />
        <Field
          id="new_password"
          label={t.authAccountNewPassword}
          type="password"
          value={next}
          onChange={setNext}
          error={error?.field("new_password")}
          autoComplete="new-password"
          required
        />

        <SubmitButton pending={pending} pendingLabel={t.authWorking}>
          {t.authAccountSave}
        </SubmitButton>
      </form>
    </Section>
  );
}

function OrderHistory() {
  const { t, l, price } = useLanguage();
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<Paginated<Order>>("/api/orders/")
      .then((page) => !cancelled && setOrders(page.results))
      .catch(() => !cancelled && setOrders([]));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Section title={t.authAccountOrders}>
      {orders === null ? (
        <p className="text-sm text-graphite">{t.authWorking}</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-graphite">{t.authAccountNoOrders}</p>
      ) : (
        <ul className="divide-y divide-line border border-line">
          {orders.map((order) => (
            <li key={order.number} className="flex flex-wrap items-center gap-4 px-5 py-4">
              {/* A few thumbnails, not the whole order — the line already says
                  how many pieces it holds, and a large order would otherwise
                  push its own number off the row. */}
              <div className="flex shrink-0 gap-1.5">
                {order.items.slice(0, 3).map((item) => (
                  <Thumbnail
                    key={item.sku}
                    src={item.image}
                    alt={l(item.name)}
                    className="h-14 w-12"
                  />
                ))}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-[family-name:var(--font-manrope)] text-sm font-semibold text-ink">
                  {order.number}
                </p>
                <p className="mt-1 text-xs text-ash">
                  {new Date(order.created_at).toLocaleDateString()} ·{" "}
                  {fmt(t.authOrderItems, { n: order.item_count })} · {order.status_label}
                </p>
                <p className="mt-2 truncate text-xs text-graphite">
                  {order.items.map((item) => l(item.name)).join(", ")}
                </p>
              </div>
              <p className="text-sm font-semibold text-ink">{price(order.total)}</p>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-5 text-sm">
        <Link href="/shop" className="text-ink underline underline-offset-4">
          {t.authBackToShop}
        </Link>
      </p>
    </Section>
  );
}
