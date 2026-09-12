import * as React from "react";

import {
  ABOUT_CONCURRENCY_CALLOUT,
  ABOUT_LIFECYCLE,
} from "@/constants/about";
import { cn } from "@/lib/utils";

import {
  aboutWorkFlowConcurrencyBodyVariants,
  aboutWorkFlowConcurrencyTitleVariants,
  aboutWorkFlowConcurrencyVariants,
  aboutWorkFlowLaneTickVariants,
  aboutWorkFlowLaneTicksVariants,
  aboutWorkFlowLifecycleBodyVariants,
  aboutWorkFlowLifecycleCardVariants,
  aboutWorkFlowLifecycleGridVariants,
  aboutWorkFlowLifecycleHeadVariants,
  aboutWorkFlowLifecycleStepVariants,
  aboutWorkFlowLifecycleTechVariants,
  aboutWorkFlowLifecycleTitleVariants,
  aboutWorkFlowSectionTitleVariants,
  aboutWorkFlowSectionVariants,
} from "./AboutWorkFlowSection.styles";

const LANE_TICKS = Array.from(
  { length: ABOUT_CONCURRENCY_CALLOUT.laneCount },
  (_, index) => index,
);

export type AboutWorkFlowSectionProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * 8-step asynchronous extraction pipeline lifecycle with concurrency lane model callout.
 */
const AboutWorkFlowSection = React.forwardRef<
  HTMLDivElement,
  AboutWorkFlowSectionProps
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-component="AboutWorkFlowSection"
      {...props}
      className={cn(aboutWorkFlowSectionVariants({ className }))}
    >
      <h2
        data-component="AboutWorkFlowSection-title"
        className={cn(aboutWorkFlowSectionTitleVariants())}
      >
        Workflow lifecycle
      </h2>

      <div
        data-component="AboutWorkFlowSection-grid"
        className={cn(aboutWorkFlowLifecycleGridVariants())}
      >
        {ABOUT_LIFECYCLE.map((step) => (
          <div
            key={step.step}
            data-component="AboutWorkFlowSection-card"
            className={cn(aboutWorkFlowLifecycleCardVariants())}
          >
            <div className={cn(aboutWorkFlowLifecycleHeadVariants())}>
              <span className={cn(aboutWorkFlowLifecycleStepVariants())}>
                {step.step}
              </span>
              <span className={cn(aboutWorkFlowLifecycleTitleVariants())}>
                {step.title}
              </span>
            </div>
            <p className={cn(aboutWorkFlowLifecycleBodyVariants())}>
              {step.body}
            </p>
            <span className={cn(aboutWorkFlowLifecycleTechVariants())}>
              {step.tech}
            </span>
          </div>
        ))}
      </div>

      <div
        data-component="AboutWorkFlowSection-concurrency"
        className={cn(aboutWorkFlowConcurrencyVariants())}
      >
        <div className="flex flex-col gap-1">
          <span className={cn(aboutWorkFlowConcurrencyTitleVariants())}>
            {ABOUT_CONCURRENCY_CALLOUT.title}
          </span>
          <p className={cn(aboutWorkFlowConcurrencyBodyVariants())}>
            {ABOUT_CONCURRENCY_CALLOUT.body}
          </p>
        </div>
        <div className={cn(aboutWorkFlowLaneTicksVariants())}>
          {LANE_TICKS.map((tick) => (
            <span
              key={tick}
              className={cn(aboutWorkFlowLaneTickVariants())}
            />
          ))}
        </div>
      </div>
    </div>
  );
});
AboutWorkFlowSection.displayName = "AboutWorkFlowSection";

export { AboutWorkFlowSection };
