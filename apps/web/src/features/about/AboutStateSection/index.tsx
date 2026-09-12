import * as React from "react";

import { ABOUT_SCALE_STATS } from "@/constants/about";
import { cn } from "@/lib/utils";

import {
  aboutStateSectionCellVariants,
  aboutStateSectionLabelVariants,
  aboutStateSectionNoteVariants,
  aboutStateSectionStripVariants,
  aboutStateSectionValueVariants,
} from "./AboutStateSection.styles";

export type AboutStateSectionProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Key technical scale & architecture metrics strip (documents, fault resilience,
 * real-time SSE push latency, S3 payload limits, worker pool lanes, execution time).
 */
const AboutStateSection = React.forwardRef<
  HTMLDivElement,
  AboutStateSectionProps
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-component="AboutStateSection"
      {...props}
      className={cn(aboutStateSectionStripVariants({ className }))}
    >
      {ABOUT_SCALE_STATS.map((stat) => (
        <div
          key={stat.label}
          data-component="AboutStateSection-cell"
          className={cn(aboutStateSectionCellVariants())}
        >
          <span
            data-component="AboutStateSection-value"
            className={cn(aboutStateSectionValueVariants())}
          >
            {stat.value}
          </span>
          <span
            data-component="AboutStateSection-label"
            className={cn(aboutStateSectionLabelVariants())}
          >
            {stat.label}
          </span>
          <span
            data-component="AboutStateSection-note"
            className={cn(aboutStateSectionNoteVariants())}
          >
            {stat.note}
          </span>
        </div>
      ))}
    </div>
  );
});
AboutStateSection.displayName = "AboutStateSection";

export { AboutStateSection };
