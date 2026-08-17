import CaseDetailsPage, {
  type CaseDetailsPageProps,
} from "../cases/shared/CaseDetailsPage";
import { colleagueCaseConfig } from "../cases/caseConfig";

export type ColleagueCaseDetailsPageProps = Omit<
  CaseDetailsPageProps,
  "config"
>;

function ColleagueCaseDetailsPage(props: ColleagueCaseDetailsPageProps) {
  return <CaseDetailsPage {...props} config={colleagueCaseConfig} />;
}

export default ColleagueCaseDetailsPage;
