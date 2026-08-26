import { ReferralsTable } from "@/features/referrals/ReferralsTable";
import { UploadWorkspace } from "@/features/referrals/UploadWorkspace";
import { WorkbenchHeader } from "@/features/navigation/WorkbenchHeader";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { requireAuth } from "@/server-actions/auth";
import { getSavedSchemas } from "@/server-actions/extraction-schemas";
import { getReferralRows } from "@/server-actions/referrals";

export async function DashboardApp() {
  const clinic = await requireAuth();

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
