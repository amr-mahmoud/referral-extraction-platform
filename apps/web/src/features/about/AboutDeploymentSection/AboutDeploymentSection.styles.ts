import { cva, type VariantProps } from "class-variance-authority";

export const aboutDeploymentSectionVariants = cva([
  "flex flex-col gap-5 rounded-[14px] bg-ink px-6 py-7 shadow-sm sm:px-9 sm:py-8",
]);

export const aboutDeploymentSectionEyebrowVariants = cva(
  "w-fit rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-brand",
);

export const aboutDeploymentSectionHeadingVariants = cva(
  "text-lg font-bold tracking-tight text-white sm:text-xl",
);

export const aboutDeploymentSectionLeadVariants = cva(
  "max-w-[760px] text-[15px] leading-relaxed font-semibold text-white/90 sm:text-base",
);

export const aboutDeploymentSectionLeadHighlightVariants = cva(
  "font-extrabold text-brand",
);

export const aboutDeploymentSectionBodyVariants = cva(
  "max-w-[760px] text-[12.5px] leading-relaxed text-white/60",
);

export const aboutDeploymentSectionGridVariants = cva(
  "grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2",
);

export const aboutDeploymentSectionItemVariants = cva(
  "flex flex-col gap-1 rounded-[10px] border border-white/10 bg-white/5 px-4 py-3.5",
);

export const aboutDeploymentSectionItemKeyVariants = cva(
  "text-[12.5px] font-bold text-white",
);

export const aboutDeploymentSectionItemDetailVariants = cva(
  "text-[12px] leading-relaxed text-white/60",
);

export type AboutDeploymentSectionVariantProps = VariantProps<
  typeof aboutDeploymentSectionVariants
>;
