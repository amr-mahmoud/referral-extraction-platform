"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

import {
  segmentedControlOptionVariants,
  segmentedControlVariants,
} from "./SegmentedControl.styles";

export interface SegmentedControlItem<TValue extends string> {
  value: TValue;
  label: string;
  /** `id` of the panel this segment controls, for `aria-controls`. */
  controls?: string;
}

export interface SegmentedControlProps<TValue extends string>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  items: readonly SegmentedControlItem<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
  /** Accessible name for the tab list. */
  label: string;
}

function SegmentedControl<TValue extends string>({
  className,
  items,
  label,
  onChange,
  value,
  ...props
}: SegmentedControlProps<TValue>) {
  return (
    <div
      role="tablist"
      aria-label={label}
      data-component="SegmentedControl"
      {...props}
      className={cn(segmentedControlVariants({ className }))}
    >
      {items.map((item) => {
        const isActive = item.value === value;

        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            id={`${item.value}-tab`}
            aria-selected={isActive}
            aria-controls={item.controls}
            tabIndex={isActive ? 0 : -1}
            data-state={isActive ? "active" : "inactive"}
            onClick={() => onChange(item.value)}
            className={cn(segmentedControlOptionVariants({ active: isActive }))}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export { SegmentedControl };
