"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseHoverMenuResult<TElement extends HTMLElement> {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  /** Attach to the element wrapping both the trigger and the panel. */
  containerRef: React.RefObject<TElement | null>;
  /** Spread onto that same wrapping element. */
  containerProps: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onKeyDown: (event: React.KeyboardEvent) => void;
  };
}

const CLOSE_DELAY_MS = 150;

/**
 * Hover-to-open menu state shared by any header dropdown. A short close delay
 * survives the cursor crossing the visual gap between trigger and panel, and
 * outside-click / Escape close it for keyboard and touch users who never
 * trigger `mouseleave` at all.
 */
export function useHoverMenu<
  TElement extends HTMLElement = HTMLDivElement,
>(): UseHoverMenuResult<TElement> {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<TElement>(null);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimeout = useCallback(() => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
  }, []);

  const open = useCallback(() => {
    clearCloseTimeout();
    setIsOpen(true);
  }, [clearCloseTimeout]);

  const close = useCallback(() => {
    clearCloseTimeout();
    setIsOpen(false);
  }, [clearCloseTimeout]);

  const toggle = useCallback(() => {
    setIsOpen((current) => !current);
  }, []);

  const scheduleClose = useCallback(() => {
    clearCloseTimeout();
    closeTimeout.current = setTimeout(() => setIsOpen(false), CLOSE_DELAY_MS);
  }, [clearCloseTimeout]);

  useEffect(() => clearCloseTimeout, [clearCloseTimeout]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Escape") close();
    },
    [close],
  );

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        close();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen, close]);

  return {
    isOpen,
    open,
    close,
    toggle,
    containerRef,
    containerProps: {
      onMouseEnter: open,
      onMouseLeave: scheduleClose,
      onKeyDown,
    },
  };
}
