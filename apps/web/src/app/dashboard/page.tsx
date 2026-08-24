import type { Metadata } from "next";

import { DashboardApp } from "@/apps/dashboard";

export const metadata: Metadata = {
  title: "Referrals · Referral Extraction Workbench",
  description:
    "Upload referral PDFs, choose an extraction schema, and track extraction results for your clinic.",
};

export default function DashboardPage() {
  return <DashboardApp />;
}
