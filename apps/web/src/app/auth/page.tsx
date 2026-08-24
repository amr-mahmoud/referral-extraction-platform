import type { Metadata } from "next";

import { AuthApp } from "@/apps/auth";

export const metadata: Metadata = {
  title: "Sign in · Referral Extraction Workbench",
  description:
    "Sign in to your clinic to upload referral PDFs and review structured extraction results.",
};

export default function AuthPage() {
  return <AuthApp />;
}
