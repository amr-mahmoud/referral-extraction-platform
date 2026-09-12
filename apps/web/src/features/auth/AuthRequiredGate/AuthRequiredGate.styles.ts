import { cva, type VariantProps } from "class-variance-authority";

/** Panel width override layered onto the shared Modal's panel. */
export const authRequiredGatePanelVariants = cva("max-w-md");

/** Scopes the backdrop overlay strictly below the header so the header remains undimmed and clickable. */
export const authRequiredGateBackdropVariants = cva(
  "top-[93px] sm:top-[73px] z-30",
);

export const authRequiredGateVariants = cva(
  "flex flex-col items-start gap-3.5 p-6 sm:p-7",
);

export const authRequiredGateEyebrowVariants = cva(
  "w-fit rounded-full bg-brand-tint px-2.5 py-1 text-[11px] font-semibold tracking-[0.04em] text-brand-deep uppercase",
);

export const authRequiredGateTitleVariants = cva(
  "text-xl font-extrabold tracking-tight text-ink",
);

export const authRequiredGateMessageVariants = cva(
  "text-sm leading-relaxed text-ink-soft",
);

export const authRequiredGateActionsVariants = cva(
  "mt-2 flex w-full flex-row items-center gap-2 sm:mt-2.5 sm:gap-2.5",
);

const authRequiredGateLinkBase =
  "inline-flex h-9 sm:h-11 flex-1 items-center justify-center rounded-full px-2.5 sm:px-5 text-[11.5px] sm:text-[13px] font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

export const authRequiredGateRegisterLinkVariants = cva([
  authRequiredGateLinkBase,
  "bg-brand text-white hover:bg-brand-deep",
]);

export const authRequiredGateSignInLinkVariants = cva([
  authRequiredGateLinkBase,
  "border border-hairline-strong bg-white text-ink hover:bg-brand-mist",
]);

export type AuthRequiredGateVariantProps = VariantProps<
  typeof authRequiredGateVariants
>;
