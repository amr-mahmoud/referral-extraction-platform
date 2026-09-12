import type { Metadata } from "next";

import { AboutApp } from "@/apps/about";

export const metadata: Metadata = {
  title: "About · Referral Extraction Workbench",
  description:
    "How the Referral Extraction Workbench is built to scale, and the stack behind it.",
};

export default function AboutPage() {
  return <AboutApp />;
}
