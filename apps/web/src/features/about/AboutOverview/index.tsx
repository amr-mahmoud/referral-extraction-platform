import * as React from "react";

import {
  ABOUT_BUSINESS_SCOPE,
  ABOUT_HERO,
  ABOUT_SCALE_LEVERS,
  ABOUT_STACK,
} from "@/constants/about";
import { cn } from "@/lib/utils";

import { AboutStateSection } from "../AboutStateSection";
import { AboutWorkFlowSection } from "../AboutWorkFlowSection";

import {
  aboutOverviewBodyVariants,
  aboutOverviewEyebrowVariants,
  aboutOverviewHeadingHighlightVariants,
  aboutOverviewHeadingVariants,
  aboutOverviewHeroVariants,
  aboutOverviewLeverDotVariants,
  aboutOverviewLeverKeyVariants,
  aboutOverviewLeverListVariants,
  aboutOverviewLeverRowVariants,
  aboutOverviewLeverTextVariants,
  aboutOverviewScopeCalloutBodyVariants,
  aboutOverviewScopeCalloutTitleVariants,
  aboutOverviewScopeCalloutVariants,
  aboutOverviewSectionTitleVariants,
  aboutOverviewSectionVariants,
  aboutOverviewStackCategoryVariants,
  aboutOverviewStackChipsVariants,
  aboutOverviewStackChipVariants,
  aboutOverviewStackGroupVariants,
  aboutOverviewStackListVariants,
  aboutOverviewTitleVariants,
  aboutOverviewTwoColVariants,
  aboutOverviewVariants,
} from "./AboutOverview.styles";

export type AboutOverviewProps = React.HTMLAttributes<HTMLElement>;

/**
 * The workbench's "About" page: scale-claim hero, stat strip, workflow
 * lifecycle grid, and a "what makes it scale" / stack two-up overview.
 */
const AboutOverview = React.forwardRef<HTMLElement, AboutOverviewProps>(
  ({ className, ...props }, ref) => {
    return (
      <section
        ref={ref}
        data-component="AboutOverview"
        {...props}
        className={cn(aboutOverviewVariants({ className }))}
      >
        <div className={cn(aboutOverviewHeroVariants())}>
          <span className={cn(aboutOverviewEyebrowVariants())}>
            {ABOUT_HERO.eyebrow}
          </span>
          <h1 className={cn(aboutOverviewTitleVariants())}>
            {ABOUT_HERO.title}
          </h1>
          <h1 className={cn(aboutOverviewHeadingVariants())}>
            Built to carry{" "}
            <span className={cn(aboutOverviewHeadingHighlightVariants())}>
              20 million documents
            </span>{" "}
            when scaled horizontally.
          </h1>
          <p className={cn(aboutOverviewBodyVariants())}>{ABOUT_HERO.body}</p>
        </div>

        <AboutStateSection />

        <AboutWorkFlowSection />

        <div className={cn(aboutOverviewSectionVariants())}>
          <div className={cn(aboutOverviewTwoColVariants())}>
            <div className="flex flex-col gap-3">
              <h2 className={cn(aboutOverviewSectionTitleVariants())}>
                What makes it scale
              </h2>
              <div className={cn(aboutOverviewLeverListVariants())}>
                {ABOUT_SCALE_LEVERS.map((lever) => (
                  <div
                    key={lever.key}
                    className={cn(aboutOverviewLeverRowVariants())}
                  >
                    <span className={cn(aboutOverviewLeverDotVariants())} />
                    <p className={cn(aboutOverviewLeverTextVariants())}>
                      <span className={cn(aboutOverviewLeverKeyVariants())}>
                        {lever.key}
                      </span>{" "}
                      — {lever.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <h2 className={cn(aboutOverviewSectionTitleVariants())}>Stack</h2>
              <div className={cn(aboutOverviewStackListVariants())}>
                {ABOUT_STACK.map((group) => (
                  <div
                    key={group.category}
                    className={cn(aboutOverviewStackGroupVariants())}
                  >
                    <span className={cn(aboutOverviewStackCategoryVariants())}>
                      {group.category}
                    </span>
                    <div className={cn(aboutOverviewStackChipsVariants())}>
                      {group.items.map((item) => (
                        <span
                          key={item}
                          className={cn(aboutOverviewStackChipVariants())}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className={cn(aboutOverviewScopeCalloutVariants())}>
                <span className={cn(aboutOverviewScopeCalloutTitleVariants())}>
                  Business scope, briefly.
                </span>
                <p className={cn(aboutOverviewScopeCalloutBodyVariants())}>
                  {ABOUT_BUSINESS_SCOPE}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  },
);
AboutOverview.displayName = "AboutOverview";

export { AboutOverview };
