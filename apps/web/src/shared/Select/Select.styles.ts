import { cva, type VariantProps } from "class-variance-authority";

export const selectVariants = cva("relative w-full");

export const selectTriggerVariants = cva(
  [
    "flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-hairline-strong",
    "bg-field px-[11px] text-ink outline-none transition-colors",
    "hover:border-control-border focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/15",
    "disabled:cursor-not-allowed disabled:opacity-55",
  ],
  {
    variants: {
      size: {
        sm: "h-[34px] text-[11.5px]",
        md: "h-[42px] text-[13px]",
      },
      // Open state fuses the trigger into the panel below it: square bottom
      // corners and a brand border shared with the panel's top-less border,
      // so the two read as one continuous shape rather than a field with a
      // popover floating separately underneath it.
      open: {
        true: "rounded-b-none border-brand ring-2 ring-brand/15 hover:border-brand",
        false: "",
      },
    },
    defaultVariants: {
      size: "sm",
      open: false,
    },
  },
);

export const selectTriggerLabelVariants = cva("truncate text-left", {
  variants: {
    placeholder: {
      true: "text-faint",
      false: "text-ink",
    },
  },
  defaultVariants: {
    placeholder: false,
  },
});

export const selectIndicatorVariants = cva(
  "shrink-0 text-faint transition-transform duration-150",
  {
    variants: {
      open: {
        true: "rotate-180",
        false: "",
      },
    },
    defaultVariants: {
      open: false,
    },
  },
);

/** No top border/radius — it sits flush under the trigger's square bottom edge. */
export const selectPanelVariants = cva([
  "absolute inset-x-0 top-full z-20 max-h-52 overflow-y-auto rounded-b-lg border border-t-0 border-brand bg-white py-1",
]);

export const selectOptionVariants = cva(
  [
    "flex w-full cursor-pointer items-center justify-between gap-2 px-[11px] py-2",
    "text-left text-[11.5px] text-ink transition-colors",
  ],
  {
    variants: {
      highlighted: {
        true: "bg-brand-tint",
        false: "",
      },
    },
    defaultVariants: {
      highlighted: false,
    },
  },
);

export const selectOptionCheckVariants = cva("shrink-0 text-brand");

export const selectEmptyVariants = cva(
  "px-[11px] py-2 text-[11.5px] text-faint",
);

export type SelectVariantProps = VariantProps<typeof selectTriggerVariants>;
