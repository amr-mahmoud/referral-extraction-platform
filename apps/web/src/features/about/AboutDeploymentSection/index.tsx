import * as React from "react";

import { ABOUT_DEPLOYMENT, ABOUT_DEPLOYMENT_ITEMS } from "@/constants/about";
import { cn } from "@/lib/utils";

import {
  aboutDeploymentSectionBodyVariants,
  aboutDeploymentSectionGridVariants,
  aboutDeploymentSectionHeadingVariants,
  aboutDeploymentSectionItemDetailVariants,
  aboutDeploymentSectionItemKeyVariants,
  aboutDeploymentSectionItemVariants,
  aboutDeploymentSectionLeadHighlightVariants,
  aboutDeploymentSectionLeadVariants,
  aboutDeploymentSectionVariants,
} from "./AboutDeploymentSection.styles";

export type AboutDeploymentSectionProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Standout proof callout: the whole stack — web, API, worker, Postgres,
 * Redis, and TLS termination — runs co-located on a single EC2 micro
 * instance, framed as a stress test of the horizontal-scaling design in
 * "What makes it scale" rather than the target production topology.
 */
const AboutDeploymentSection = React.forwardRef<
  HTMLDivElement,
  AboutDeploymentSectionProps
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-component="AboutDeploymentSection"
      {...props}
      className={cn(aboutDeploymentSectionVariants({ className }))}
    >
      <h2 className={cn(aboutDeploymentSectionHeadingVariants())}>
        {ABOUT_DEPLOYMENT.heading}
      </h2>

      <p className={cn(aboutDeploymentSectionLeadVariants())}>
        {ABOUT_DEPLOYMENT.leadPrefix}
        <span className={cn(aboutDeploymentSectionLeadHighlightVariants())}>
          {ABOUT_DEPLOYMENT.leadHighlight}
        </span>
        {ABOUT_DEPLOYMENT.leadSuffix}
      </p>

      <p className={cn(aboutDeploymentSectionBodyVariants())}>
        {ABOUT_DEPLOYMENT.body}
      </p>

      <div className={cn(aboutDeploymentSectionGridVariants())}>
        {ABOUT_DEPLOYMENT_ITEMS.map((item) => (
          <div
            key={item.key}
            data-component="AboutDeploymentSection-item"
            className={cn(aboutDeploymentSectionItemVariants())}
          >
            <span className={cn(aboutDeploymentSectionItemKeyVariants())}>
              {item.key}
            </span>
            <p className={cn(aboutDeploymentSectionItemDetailVariants())}>
              {item.detail}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
});
AboutDeploymentSection.displayName = "AboutDeploymentSection";

export { AboutDeploymentSection };
