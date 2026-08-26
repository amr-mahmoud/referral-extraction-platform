import { cva, type VariantProps } from "class-variance-authority";

export const referralDetailHeaderVariants = cva([
  "flex h-[60px] shrink-0 items-center gap-2 border-b border-hairline bg-white",
  "px-5 sm:px-6",
]);

export const referralDetailHeaderBreadcrumbVariants = cva(
  "flex min-w-0 items-center gap-2.5",
);

export const referralDetailHeaderBackLinkVariants = cva([
  "inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand-deep",
  "transition-colors hover:text-brand focus-visible:ring-2 focus-visible:ring-brand/45",
  "outline-none rounded-sm",
]);

export const referralDetailHeaderSeparatorVariants = cva("text-muted/70");

export const referralDetailHeaderTitleVariants = cva(
  "truncate text-[12.5px] font-bold text-ink",
);

export const referralDetailHeaderPillVariants = cva("shrink-0");

export type ReferralDetailHeaderVariantProps = VariantProps<
  typeof referralDetailHeaderVariants
>;
