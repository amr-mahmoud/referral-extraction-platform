"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

import { modalBackdropVariants, modalPanelVariants } from "./Modal.styles";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface ModalProps {
  /** Accessible name — id of the element carrying the dialog's title. */
  labelledBy: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * A modal backdrop + panel: body-scroll lock, Escape-to-close, backdrop-click
 * to close, and a focus trap cycling Tab within the panel. Mount it only
 * while open — unmounting is what resets any state the panel's contents own,
 * so no separate "reset on open" plumbing is needed.
 */
const Modal = ({ labelledBy, onClose, children, className }: ModalProps) => {
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div
      data-component="Modal"
      className={cn(modalBackdropVariants())}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={cn(modalPanelVariants({ className }))}
      >
        {children}
      </div>
    </div>
  );
};
Modal.displayName = "Modal";

export { Modal };
