import { cva, type VariantProps } from "class-variance-authority";

export const authBrandPanelVariants = cva([
  "flex flex-col justify-center  gap-10 px-8 py-16 sm:px-10 min-h-[300px]",
  "bg-[linear-gradient(160deg,#efeffe_0%,#e4e2fd_55%,#dcd9fc_100%)] ",
]);

export const authBrandPanelCopyVariants = cva(
  "flex flex-col gap-4 lg:h-[510px] md:h-full sm:h-full ",
);

export const authBrandPanelHeadlineVariants = cva(
  "text-[50px]/[1.08] font-extrabold tracking-[-0.02em] text-ink",
);

export const authBrandPanelAccentVariants = cva("text-brand");

export const authBrandPanelBlurbVariants = cva(
  " lg:max-w-[380px] md:max-w-[450px] text-md/[1.6] text-ink-soft",
);

export const authBrandPanelRuleVariants = cva(
  "h-2 w-[120px] rounded-[4px] bg-brand/15",
);

export type AuthBrandPanelVariantProps = VariantProps<
  typeof authBrandPanelVariants
>;
