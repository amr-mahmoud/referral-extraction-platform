import { CLINIC_NAME } from "@/client/mock-api";
import { ReferralsTable } from "@/features/referrals/ReferralsTable";
import { UploadWorkspace } from "@/features/referrals/UploadWorkspace";
import { WorkbenchHeader } from "@/features/navigation/WorkbenchHeader";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { getMeAction } from "@/server-actions/auth";
import { getSavedSchemas } from "@/server-actions/extraction-schemas";
import { getReferralRows, getThroughputStats } from "@/server-actions/referrals";

/**
 * Entry point for `/dashboard` (wireframe 1c). Reads on the server, hands the
 * results to the client islands that need interaction.
 */
export async function DashboardApp() {
  const [referrals, savedSchemas, stats, meResult] = await Promise.all([
    getReferralRows(),
    getSavedSchemas(),
    getThroughputStats(),
    getMeAction(),
  ]);

  const clinicName =
    meResult.success && meResult.data?.clinicName
      ? meResult.data.clinicName
      : CLINIC_NAME;

  return (
    <DashboardLayout
      header={<WorkbenchHeader clinicName={clinicName} />}
    >
      <UploadWorkspace savedSchemas={savedSchemas} />
      <ReferralsTable referrals={referrals} />
    </DashboardLayout>
  );
}
