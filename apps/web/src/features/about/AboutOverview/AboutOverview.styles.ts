import { cva, type VariantProps } from "class-variance-authority";

export const aboutOverviewVariants = cva(
  "flex flex-col gap-8 rounded-[16px] border border-hairline bg-white pb-8 sm:pb-11",
);

export const aboutOverviewHeroVariants = cva([
  "flex flex-col gap-3 rounded-t-[16px] px-7 pt-9 pb-7 sm:px-11",
  "bg-gradient-to-b from-brand-mist to-white",
]);

export const aboutOverviewEyebrowVariants = cva(
  "w-fit rounded-full bg-brand-tint px-2.5 py-1 text-[11px] font-semibold text-brand-deep",
);

export const aboutOverviewTitleVariants = cva(
  "text-[26px] leading-[1.15] font-extrabold tracking-tight text-ink sm:text-[34px]",
);

export const aboutOverviewHeadingVariants = cva(
  "max-w-[720px] text-[18px] leading-[1.25] font-bold tracking-tight text-ink-soft sm:text-[22px]",
);

export const aboutOverviewHeadingHighlightVariants = cva("text-brand font-extrabold");

export const aboutOverviewBodyVariants = cva(
  "max-w-[680px] text-sm leading-relaxed text-muted",
);

export const aboutOverviewSectionVariants = cva(
  "flex flex-col gap-4 px-7 sm:px-11",
);

export const aboutOverviewSectionTitleVariants = cva(
  "text-base font-bold text-ink",
);

export const aboutOverviewTwoColVariants = cva(
  "grid grid-cols-1 gap-7  lg:grid-cols-2",
);

export const aboutOverviewLeverListVariants = cva("flex flex-col gap-2.5");

export const aboutOverviewLeverRowVariants = cva("flex items-start gap-2.5");

export const aboutOverviewLeverDotVariants = cva(
  "mt-[6px] size-[7px] shrink-0 rounded-full bg-brand",
);

export const aboutOverviewLeverTextVariants = cva(
  "text-[12.5px] leading-relaxed text-ink-soft",
);

export const aboutOverviewLeverKeyVariants = cva("font-bold text-ink");

export const aboutOverviewStackListVariants = cva("flex flex-col gap-2.5");

export const aboutOverviewStackGroupVariants = cva(
  "flex flex-col gap-1.5 rounded-[9px] border border-hairline px-3 py-2.5",
);

export const aboutOverviewStackCategoryVariants = cva(
  "text-[13px] font-semibold text-ink",
);

export const aboutOverviewStackChipsVariants = cva("flex flex-wrap gap-1.5");

export const aboutOverviewStackChipVariants = cva(
  "rounded-full bg-brand-tint px-2 py-1 text-[11px] font-semibold text-brand-deep",
);

export const aboutOverviewScopeCalloutVariants = cva([
  "flex flex-col gap-1.5 rounded-[12px] border border-hairline-strong",
  "bg-brand-mist px-4.5 py-4",
]);

export const aboutOverviewScopeCalloutTitleVariants = cva(
  "text-[12.5px] font-bold text-ink",
);

export const aboutOverviewScopeCalloutBodyVariants = cva(
  "text-[12px] leading-relaxed text-muted",
);

export const aboutOverviewHeroGitHubCtaVariants = cva([
  "group inline-flex items-center gap-3 rounded-[12px] bg-ink px-4.5 py-3",
  "text-white shadow-sm transition-all duration-200 w-fit",
  "hover:bg-brand hover:shadow-md hover:ring-3 hover:ring-brand/25 active:scale-[0.99]",
]);

export const aboutOverviewHeroGitHubIconVariants = cva([
  "flex size-7 shrink-0 items-center justify-center rounded-[8px] bg-white/12",
  "text-white transition-all duration-200 group-hover:scale-105 group-hover:bg-white/20",
]);

export const aboutOverviewHeroGitHubTitleVariants = cva(
  "text-[13.5px] font-bold tracking-tight text-white",
);

export const aboutOverviewHeroGitHubDividerVariants = cva(
  "hidden text-white/30 sm:inline",
);

export const aboutOverviewHeroGitHubRepoVariants = cva(
  "hidden font-mono text-[12px] font-normal text-white/75 sm:inline",
);

export const aboutOverviewHeroGitHubArrowVariants = cva(
  "size-3.5 shrink-0 text-white/60 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-white",
);

export type AboutOverviewVariantProps = VariantProps<
  typeof aboutOverviewVariants
>;


