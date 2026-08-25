"use client";

import * as React from "react";

import { useSelectDropdown } from "@/hooks/use-select-dropdown";
import { cn } from "@/lib/utils";
import { CheckIcon, ChevronDownIcon } from "@/shared/Icon";

import {
  selectEmptyVariants,
  selectIndicatorVariants,
  selectOptionCheckVariants,
  selectOptionVariants,
  selectPanelVariants,
  selectTriggerLabelVariants,
  selectTriggerVariants,
  selectVariants,
  type SelectVariantProps,
} from "./Select.styles";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectVariantProps {
  options: readonly SelectOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** Shown when nothing is selected, or when `options` is empty. */
  placeholder?: string;
  "aria-label"?: string;
  className?: string;
  /** Applied to the wrapper rather than the trigger button. */
  containerClassName?: string;
}

/**
 * A custom single-select listbox, not a native `<select>` — the browser's own
 * chrome around a native control can't be restyled to match the rest of the
 * app, and the open panel is built to read as a direct extension of the
 * trigger field (shared border, no gap, no floating-card shadow) rather than
 * a separate popover sitting on top of it.
 */
const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      className,
      containerClassName,
      disabled,
      options,
      placeholder = "Select…",
      size,
      value,
      onChange,
      "aria-label": ariaLabel,
    },
    ref,
  ) => {
    const listboxId = React.useId();
    const selectedIndex = options.findIndex((option) => option.value === value);
    const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : undefined;

    const dropdown = useSelectDropdown<HTMLDivElement>({
      optionCount: options.length,
      selectedIndex,
      disabled,
      onCommit: (index) => {
        const option = options[index];
        if (option) onChange(option.value);
      },
    });

    return (
      <div
        ref={dropdown.containerRef}
        data-component="Select"
        data-state={dropdown.isOpen ? "open" : "closed"}
        className={cn(selectVariants({ className: containerClassName }))}
      >
        <button
          ref={ref}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={dropdown.isOpen}
          aria-controls={listboxId}
          aria-label={ariaLabel}
          disabled={disabled || options.length === 0}
          onClick={dropdown.toggle}
          onKeyDown={dropdown.onTriggerKeyDown}
          className={cn(
            selectTriggerVariants({ size, open: dropdown.isOpen, className }),
          )}
        >
          <span
            className={cn(
              selectTriggerLabelVariants({ placeholder: !selectedOption }),
            )}
          >
            {selectedOption?.label ?? placeholder}
          </span>
          <ChevronDownIcon
            size="sm"
            className={cn(selectIndicatorVariants({ open: dropdown.isOpen }))}
          />
        </button>

        {dropdown.isOpen ? (
          <ul
            id={listboxId}
            role="listbox"
            aria-label={ariaLabel}
            className={cn(selectPanelVariants())}
          >
            {options.length === 0 ? (
              <li className={cn(selectEmptyVariants())}>Nothing to select</li>
            ) : (
              options.map((option, index) => (
                <li
                  key={option.value}
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  aria-selected={option.value === value}
                  onMouseEnter={() => dropdown.setHighlightedIndex(index)}
                  onClick={() => {
                    onChange(option.value);
                    dropdown.close();
                  }}
                  className={cn(
                    selectOptionVariants({
                      highlighted: index === dropdown.highlightedIndex,
                    }),
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {option.value === value ? (
                    <CheckIcon size="sm" className={cn(selectOptionCheckVariants())} />
                  ) : null}
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>
    );
  },
);
Select.displayName = "Select";

export { Select };
