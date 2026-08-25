"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseSelectDropdownOptions {
  optionCount: number;
  /** Index the panel should highlight when it opens; -1 if nothing is selected. */
  selectedIndex: number;
  onCommit: (index: number) => void;
  disabled?: boolean;
}

export interface UseSelectDropdownResult<TElement extends HTMLElement> {
  isOpen: boolean;
  highlightedIndex: number;
  /** Attach to the element wrapping both the trigger and the panel. */
  containerRef: React.RefObject<TElement | null>;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setHighlightedIndex: (index: number) => void;
  /** Attach to the trigger button. */
  onTriggerKeyDown: (event: React.KeyboardEvent) => void;
}

/**
 * Open/close + keyboard navigation for a custom (non-native) single-select
 * listbox — the "Collapsible Dropdown Listbox" pattern from the ARIA APG.
 * Focus stays on the trigger throughout; options are chosen by index, never
 * by moving DOM focus into the list, so a simple click or Arrow+Enter both
 * land on `onCommit` the same way.
 */
export function useSelectDropdown<TElement extends HTMLElement = HTMLDivElement>({
  optionCount,
  selectedIndex,
  onCommit,
  disabled,
}: UseSelectDropdownOptions): UseSelectDropdownResult<TElement> {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(
    Math.max(selectedIndex, 0),
  );
  const containerRef = useRef<TElement>(null);

  const open = useCallback(() => {
    if (disabled || optionCount === 0) return;
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setIsOpen(true);
  }, [disabled, optionCount, selectedIndex]);

  const close = useCallback(() => setIsOpen(false), []);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
      return;
    }
    open();
  }, [close, isOpen, open]);

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

  const onTriggerKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (disabled || optionCount === 0) return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          if (!isOpen) {
            open();
            return;
          }
          setHighlightedIndex((current) => Math.min(current + 1, optionCount - 1));
          return;
        case "ArrowUp":
          event.preventDefault();
          if (!isOpen) {
            open();
            return;
          }
          setHighlightedIndex((current) => Math.max(current - 1, 0));
          return;
        case "Home":
          if (!isOpen) return;
          event.preventDefault();
          setHighlightedIndex(0);
          return;
        case "End":
          if (!isOpen) return;
          event.preventDefault();
          setHighlightedIndex(optionCount - 1);
          return;
        case "Enter":
        case " ":
          event.preventDefault();
          if (!isOpen) {
            open();
            return;
          }
          onCommit(highlightedIndex);
          close();
          return;
        case "Escape":
          if (!isOpen) return;
          event.preventDefault();
          close();
          return;
        default:
          return;
      }
    },
    [close, disabled, highlightedIndex, isOpen, onCommit, open, optionCount],
  );

  return {
    isOpen,
    highlightedIndex,
    containerRef,
    open,
    close,
    toggle,
    setHighlightedIndex,
    onTriggerKeyDown,
  };
}
