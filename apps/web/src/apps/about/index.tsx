import { AboutOverview } from "@/features/about/AboutOverview";
import { WorkbenchHeader } from "@/features/navigation/WorkbenchHeader";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { getAuthenticatedClinic } from "@/server-actions/auth";

/**
 * Entry point for the public `/about` route. Renders for guests and signed-in
 * clinics alike; the header simply swaps the clinic identity chip for
 * Register / Sign in actions when there is no session.
 */
export async function AboutApp() {
  const clinic = await getAuthenticatedClinic();

  return (
    <DashboardLayout
      contentWidth="full"
      contentClassName="px-0"
      header={<WorkbenchHeader clinicName={clinic?.clinicName ?? null} />}
    >
      <div className="mx-auto w-full max-w-[1400px] px-0 py-6 sm:py-8">
        <AboutOverview />
      </div>
    </DashboardLayout>
  );
}
