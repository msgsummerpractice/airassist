import CaseDetailsPage, {
  type CaseDetailsPageProps,
} from "../cases/shared/CaseDetailsPage";
import { passengerCaseConfig } from "../cases/caseConfig";

export type PassengerCaseDetailsPageProps = Omit<
  CaseDetailsPageProps,
  "config"
>;

function PassengerCaseDetailsPage(props: PassengerCaseDetailsPageProps) {
  return <CaseDetailsPage {...props} config={passengerCaseConfig} />;
}

export default PassengerCaseDetailsPage;
