import { cva, type VariantProps } from "class-variance-authority";

export const aboutWorkFlowSectionVariants = cva(
  "flex flex-col gap-4 px-7 sm:px-11",
);

export const aboutWorkFlowSectionTitleVariants = cva(
  "text-base font-bold text-ink",
);

export const aboutWorkFlowLifecycleGridVariants = cva(
  "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4",
);

export const aboutWorkFlowLifecycleCardVariants = cva(
  "flex flex-col gap-1.5 rounded-[10px] border border-hairline border-t-[3px] border-t-brand px-3.5 py-3",
);

export const aboutWorkFlowLifecycleHeadVariants = cva(
  "flex items-center gap-2",
);

export const aboutWorkFlowLifecycleStepVariants = cva(
  "rounded-[5px] bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white",
);

export const aboutWorkFlowLifecycleTitleVariants = cva(
  "text-[12.5px] font-semibold text-ink",
);

export const aboutWorkFlowLifecycleBodyVariants = cva(
  "text-[11.5px] leading-snug text-muted",
);

export const aboutWorkFlowLifecycleTechVariants = cva(
  "w-fit rounded-[5px] bg-brand-tint px-1.5 py-0.5 text-[10px] font-semibold text-brand-deep",
);

export const aboutWorkFlowConcurrencyVariants = cva([
  "grid grid-cols-1 items-center gap-4 rounded-[10px] border border-l-[3px] border-hairline-strong",
  "border-l-brand bg-brand-mist px-4 py-3.5 sm:grid-cols-[1fr_auto]",
]);

export const aboutWorkFlowConcurrencyTitleVariants = cva(
  "text-[13px] font-bold text-ink",
);

export const aboutWorkFlowConcurrencyBodyVariants = cva(
  "text-[12.5px] leading-relaxed text-ink-soft",
);

export const aboutWorkFlowLaneTicksVariants = cva(
  "flex flex-wrap justify-end gap-1",
);

export const aboutWorkFlowLaneTickVariants = cva(
  "h-[26px] w-3 rounded-sm bg-brand/85",
);

export type AboutWorkFlowSectionVariantProps = VariantProps<
  typeof aboutWorkFlowSectionVariants
>;
