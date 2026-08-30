"use client";

import { useEffect, type ReactNode } from "react";
import { CloseIcon } from "@/components/icons";

/**
 * Generic centered dialog for admin create/edit forms.
 *
 * Adapted from `CartDrawer`'s pattern: the panel stays mounted so the closing
 * animation has something to animate, `inert` keeps it out of the a11y tree
 * and tab order while closed, and Escape closes it same as the scrim click.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <div className="modal-root" data-open={open} inert={!open}>
      <button
        aria-label="Закрыть"
        tabIndex={open ? undefined : -1}
        onClick={onClose}
        className="modal-scrim cursor-pointer"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="modal-panel w-full max-w-lg max-h-[90vh] overflow-y-auto border border-line bg-white"
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="cursor-pointer p-1 text-ink"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
