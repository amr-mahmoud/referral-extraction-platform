import { ReferralsTable } from "@/features/referrals/ReferralsTable";
import { UploadWorkspace } from "@/features/referrals/UploadWorkspace";
import { WorkbenchHeader } from "@/features/navigation/WorkbenchHeader";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { getMeAction } from "@/server-actions/auth";
import { getSavedSchemas } from "@/server-actions/extraction-schemas";
import { getReferralRows } from "@/server-actions/referrals";

const DEFAULT_CLINIC_NAME = "Referral Workbench";

/**
 * Entry point for `/dashboard` (wireframe 1c). Reads on the server, hands the
 * results to the client islands that need interaction.
 */
export async function DashboardApp() {
  const [referrals, savedSchemas, meResult] = await Promise.all([
    getReferralRows(),
    getSavedSchemas(),
    getMeAction(),
  ]);

  const clinicName =
    meResult.success && meResult.data?.clinicName
      ? meResult.data.clinicName
      : DEFAULT_CLINIC_NAME;

  return (
    <DashboardLayout
      header={<WorkbenchHeader clinicName={clinicName} />}
    >
      <UploadWorkspace savedSchemas={savedSchemas} />
      <ReferralsTable referrals={referrals} />
    </DashboardLayout>
  );
}
