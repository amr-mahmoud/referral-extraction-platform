import { CLINIC_NAME } from "@/client/mock-api";
import { ReferralsTable } from "@/features/referrals/ReferralsTable";
import { UploadWorkspace } from "@/features/referrals/UploadWorkspace";
import { WorkbenchHeader } from "@/features/navigation/WorkbenchHeader";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { getSavedSchemas } from "@/server-actions/extraction-schemas";
import { getReferralRows, getThroughputStats } from "@/server-actions/referrals";

/**
 * Entry point for `/dashboard` (wireframe 1c). Reads on the server, hands the
 * results to the client islands that need interaction.
 *
 * Every read currently resolves against `client/mock-api.ts` — the WorkBench
 * API has no referral or schema endpoints yet. Swapping in the real typed REST
 * client is a change inside `server-actions/`, not here.
 */
export async function DashboardApp() {
  const [referrals, savedSchemas, stats] = await Promise.all([
    getReferralRows(),
    getSavedSchemas(),
    getThroughputStats(),
  ]);

  return (
    <DashboardLayout
  
      header={<WorkbenchHeader clinicName={CLINIC_NAME} />}
    >
      <UploadWorkspace savedSchemas={savedSchemas} />
      <ReferralsTable referrals={referrals} />
    </DashboardLayout>
  );
}
