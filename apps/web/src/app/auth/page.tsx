import type { Metadata } from "next";

import { AuthApp } from "@/apps/auth";
import { parseAuthMode } from "@/constants/auth";

export const metadata: Metadata = {
  title: "Sign in · Referral Extraction Workbench",
  description:
    "Sign in to your clinic to upload referral PDFs and review structured extraction results.",
};

interface AuthPageProps {
  searchParams: Promise<{ mode?: string }>;
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const { mode } = await searchParams;

  return <AuthApp initialMode={parseAuthMode(mode)} />;
}
