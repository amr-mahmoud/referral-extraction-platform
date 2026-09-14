"use client";

import * as React from "react";

import { SAMPLE_DOCUMENTS_DOWNLOAD_URL } from "@/constants/referrals";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/Button";
import { DocumentIcon, DownloadIcon } from "@/shared/Icon";

import {
  sampleDocumentsBannerBadgeVariants,
  sampleDocumentsBannerButtonVariants,
  sampleDocumentsBannerContentVariants,
  sampleDocumentsBannerDescriptionVariants,
  sampleDocumentsBannerIconBoxVariants,
  sampleDocumentsBannerLeftVariants,
  sampleDocumentsBannerTitleRowVariants,
  sampleDocumentsBannerTitleVariants,
  sampleDocumentsBannerVariants,
} from "./SampleDocumentsBanner.styles";

export interface SampleDocumentsBannerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Override URL for the sample documents bundle (e.g. S3 presigned URL or zip endpoint). */
  downloadUrl?: string;
}

/**
 * Prompt banner shown on the dashboard for visitors or evaluators who don't have
 * medical referral PDFs on hand. Allows downloading a package of sample clinical
 * documents in one click to immediately test the extraction pipeline.
 */
const SampleDocumentsBanner = React.forwardRef<
  HTMLDivElement,
  SampleDocumentsBannerProps
>(({ className, downloadUrl, ...props }, ref) => {
  const [isDownloading, setIsDownloading] = React.useState(false);

  // Fallback target: reads NEXT_PUBLIC_EXAMPLE_DOCS_URL or defaults to the public examples S3 bucket zip
  const targetUrl =
    downloadUrl ??
    process.env.NEXT_PUBLIC_EXAMPLE_DOCS_URL ??
    SAMPLE_DOCUMENTS_DOWNLOAD_URL;

  const handleDownload = () => {
    setIsDownloading(true);
    try {
      const link = document.createElement("a");
      link.href = targetUrl;
      link.download = "example-medical-referrals.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setTimeout(() => setIsDownloading(false), 1500);
    }
  };

  return (
    <div
      ref={ref}
      data-component="SampleDocumentsBanner"
      {...props}
      className={cn(sampleDocumentsBannerVariants({ className }))}
    >
      <div className={cn(sampleDocumentsBannerLeftVariants())}>
        <div className={cn(sampleDocumentsBannerIconBoxVariants())}>
          <DocumentIcon className="size-5" />
        </div>

        <div className={cn(sampleDocumentsBannerContentVariants())}>
          <div className={cn(sampleDocumentsBannerTitleRowVariants())}>
            <span className={cn(sampleDocumentsBannerTitleVariants())}>
              Don&apos;t have medical documents?
            </span>
            <span className={cn(sampleDocumentsBannerBadgeVariants())}>
              20 Sample PDFs
            </span>
          </div>
          <p className={cn(sampleDocumentsBannerDescriptionVariants())}>
            Download a ready-to-test package of anonymized clinical referral PDFs
            to run through the extraction workbench.
          </p>
        </div>
      </div>

      <Button
        variant="primary"
        size="sm"
        disabled={isDownloading}
        onClick={handleDownload}
        className={cn(sampleDocumentsBannerButtonVariants())}
        data-component="SampleDocumentsBanner-downloadButton"
      >
        <DownloadIcon className="size-4" />
        {isDownloading ? "Downloading..." : "Download examples"}
      </Button>
    </div>
  );
});
SampleDocumentsBanner.displayName = "SampleDocumentsBanner";

export { SampleDocumentsBanner };
