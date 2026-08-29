"use client";

import type { ReactNode } from "react";

/**
 * Form pieces shared by the account pages.
 *
 * They exist so that a field renders its own error in the same place every
 * time — the API returns errors keyed by field name, and scattering that
 * rendering across five forms is how they drift apart.
 */

export function Field({
  id,
  label,
  type = "text",
  value,
  onChange,
  error,
  required,
  autoComplete,
  autoFocus,
  placeholder,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const errorId = `${id}-error`;

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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`w-full border px-3.5 py-3 text-sm text-ink placeholder:text-ash focus:outline-none ${
          error ? "border-red-700 focus:border-red-700" : "border-line focus:border-ink"
        }`}
      />
      {error ? (
        <p id={errorId} className="mt-1.5 text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function FormError({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="border border-red-700/30 bg-red-50 px-3.5 py-3 text-sm text-red-800">
      {children}
    </p>
  );
}

export function FormNotice({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="status" className="border border-line bg-card px-3.5 py-3 text-sm text-ink">
      {children}
    </p>
  );
}

export function SubmitButton({
  children,
  pending,
  pendingLabel,
}: {
  children: ReactNode;
  pending: boolean;
  pendingLabel: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full cursor-pointer bg-ink px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-opacity hover:opacity-85 disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="container-shell py-14 sm:py-20">
      <div className="mx-auto w-full max-w-md">
        <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-graphite">{description}</p>
        <div className="mt-8">{children}</div>
        {footer ? <div className="mt-6 text-sm text-graphite">{footer}</div> : null}
      </div>
    </div>
  );
}
