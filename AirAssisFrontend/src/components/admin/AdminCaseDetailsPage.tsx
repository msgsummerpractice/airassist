import CaseDetailsPage, {
  type CaseDetailsPageProps,
} from "../cases/shared/CaseDetailsPage";
import { adminCaseConfig } from "../cases/caseConfig";

export type AdminCaseDetailsPageProps = Omit<CaseDetailsPageProps, "config">;

function AdminCaseDetailsPage(props: AdminCaseDetailsPageProps) {
  return <CaseDetailsPage {...props} config={adminCaseConfig} />;
}

export default AdminCaseDetailsPage;
