import * as React from "react";

import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "@/shared/Icon";

import {
  selectControlVariants,
  selectIndicatorVariants,
  selectVariants,
  type SelectVariantProps,
} from "./Select.styles";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size" | "children">,
    SelectVariantProps {
  options: readonly SelectOption[];
  /** Applied to the wrapper rather than the `<select>`. */
  containerClassName?: string;
}

/** Native `<select>` behind the wireframe's field styling — no popover to trap focus. */
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, containerClassName, options, size, ...props }, ref) => {
    return (
      <span
        data-component="Select"
        className={cn(selectVariants({ className: containerClassName }))}
      >
        <select
          ref={ref}
          {...props}
          className={cn(selectControlVariants({ size, className }))}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <ChevronDownIcon size="sm" className={cn(selectIndicatorVariants())} />
      </span>
    );
  },
);
Select.displayName = "Select";

export { Select };
