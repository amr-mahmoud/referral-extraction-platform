import { AuthRequiredGate } from "@/features/auth/AuthRequiredGate";
import { ReferralsTable } from "@/features/referrals/ReferralsTable";
import { UploadWorkspace } from "@/features/referrals/UploadWorkspace";
import { WorkbenchHeader } from "@/features/navigation/WorkbenchHeader";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { getAuthenticatedClinic } from "@/server-actions/auth";
import { getSavedSchemas } from "@/server-actions/extraction-schemas";
import { getReferralRows } from "@/server-actions/referrals";

export async function DashboardApp() {
  const clinic = await getAuthenticatedClinic();

  // No clinic session: render the shell dimmed behind a registration gate
  // rather than redirecting, so the demo is discoverable without an account.
  if (!clinic) {
    return (
      <DashboardLayout header={<WorkbenchHeader clinicName={null} />}>
        <AuthRequiredGate />
      </DashboardLayout>
    );
  }

  const [referrals, savedSchemas] = await Promise.all([
    getReferralRows(),
    getSavedSchemas(),
  ]);

  return (
    <DashboardLayout
      header={<WorkbenchHeader clinicName={clinic.clinicName} />}
    >
      <UploadWorkspace savedSchemas={savedSchemas} />
      <ReferralsTable referrals={referrals} />
    </DashboardLayout>
  );
}
