import { cva, type VariantProps } from "class-variance-authority";

export const authBrandPanelVariants = cva([
  "flex flex-col justify-start gap-10 px-8 py-14 sm:px-10 ",
  "bg-[linear-gradient(160deg,#efeffe_0%,#e4e2fd_55%,#dcd9fc_100%)] ",
]);

export const authBrandPanelCopyVariants = cva("flex flex-col gap-4");

export const authBrandPanelHeadlineVariants = cva(
  "text-[38px]/[1.08] font-extrabold tracking-[-0.02em] text-ink",
);

export const authBrandPanelAccentVariants = cva("text-brand");

export const authBrandPanelBlurbVariants = cva(
  "max-w-[300px] text-sm/[1.6] text-ink-soft",
);

export const authBrandPanelRuleVariants = cva(
  "h-2 w-[120px] rounded-[4px] bg-brand/15",
);

export type AuthBrandPanelVariantProps = VariantProps<
  typeof authBrandPanelVariants
>;
