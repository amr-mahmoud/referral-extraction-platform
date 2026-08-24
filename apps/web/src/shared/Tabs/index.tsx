"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

import {
  tabsCountVariants,
  tabsTriggerVariants,
  tabsVariants,
} from "./Tabs.styles";

export interface TabItem<TValue extends string> {
  value: TValue;
  label: string;
  /** Rendered as a badge after the label when set. */
  count?: number;
  /** `id` of the panel this tab controls, for `aria-controls`. */
  controls?: string;
}

export interface TabsProps<TValue extends string>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  items: readonly TabItem<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
  /** Accessible name for the tab list. */
  label: string;
}

/** Underlined tab strip — the table's status filter, and any list like it. */
function Tabs<TValue extends string>({
  className,
  items,
  label,
  onChange,
  value,
  ...props
}: TabsProps<TValue>) {
  return (
    <div
      role="tablist"
      aria-label={label}
      data-component="Tabs"
      {...props}
      className={cn(tabsVariants({ className }))}
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
            className={cn(tabsTriggerVariants({ active: isActive }))}
          >
            {item.label}
            {item.count === undefined ? null : (
              <span className={cn(tabsCountVariants({ active: isActive }))}>
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export { Tabs };
