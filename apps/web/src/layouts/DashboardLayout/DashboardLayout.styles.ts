import { cva, type VariantProps } from "class-variance-authority";

/**
 * Fills the viewport when content is short and grows past it when it isn't:
 * the shell claims a full `dvh`, the chrome keeps its natural height, and
 * `main` takes the remainder. Deliberately no `min-h-0` on `main` — that would
 * let it shrink under its own content and clip the table instead of scrolling.
 */
export const dashboardLayoutVariants = cva(
  "flex min-h-dvh w-full flex-1 flex-col bg-white",
);

export const dashboardLayoutMainVariants = cva(
  "flex w-full flex-1 flex-col bg-canvas",
);

/**
 * Content column variants. `contained` centres content on ultra-wide displays
 * with padding (the dashboard); `full` lets a page bleed edge-to-edge with no
 * max-width or padding (the public About page).
 */
export const dashboardLayoutContentVariants = cva(
  "flex w-full flex-1 flex-col",
  {
    variants: {
      width: {
        contained: "mx-auto max-w-[1600px] gap-6 px-5 py-6 sm:px-7 sm:py-7",
        full: "",
      },
    },
    defaultVariants: {
      width: "contained",
    },
  },
);

export type DashboardLayoutContentWidth = NonNullable<
  VariantProps<typeof dashboardLayoutContentVariants>["width"]
>;

export type DashboardLayoutVariantProps = VariantProps<
  typeof dashboardLayoutVariants
>;
