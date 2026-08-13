import AddTaskOutlinedIcon from "@mui/icons-material/AddTaskOutlined";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import { Box } from "@mui/material";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import FlightItineraryStep from "./steps/FlightItineraryStep";
import FlightDetailsStep from "./steps/FlightDetailsStep";
import DisruptionStep from "./steps/DisruptionStep";
import {
  type Itinerary,
  type Leg,
  type DisruptionFormData,
  EMPTY_ITINERARY,
  EMPTY_PASSENGER,
  EMPTY_DOCUMENT_UPLOAD,
  EMPTY_GDPR,
  buildLegs,
} from "./types/wizardTypes";
import PassangersStep from "./steps/PassangersStep";
import DocumentUploadStep from "./steps/DocumentUploadStep";
import GDPRStep from "./steps/GDPRStep";
import OverviewStep from "./steps/OverviewStep.tsx";
import WizardProgressBar from "./WizardProgressBar";
import PortalUserHeader from "../portal/PortalUserHeader";
import { clearStoredUserIdentity, getStoredUserIdentity } from "../../utils/auth";

const wizardSteps = [
  "Itinerary",
  "Flight Details",
  "Disruption",
  "Passenger",
  "Documents",
  "Consent",
  "Overview",
];

const defaultDisruption: DisruptionFormData = {
  motive: "",
  cancellation_type: "",
  delay_type: "",
  denied_boarding_type: "",
  denied_boarding_reason: "",
  airline_motive_mentioned: "",
  airline_motive: "",
  incident_description: "",
};

type CaseEntryFormProps = {
  isColleagueCaseEntry?: boolean;
};

function CaseEntryForm({ isColleagueCaseEntry = false }: CaseEntryFormProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [itinerary, setItinerary] = useState<Itinerary>(EMPTY_ITINERARY);
  const [legDetails, setLegDetails] = useState<Leg[]>([]);
  const [disruption, setDisruption] =
    useState<DisruptionFormData>(defaultDisruption);
  const [passenger, setPassenger] = useState(EMPTY_PASSENGER);
  const [documents, setDocuments] = useState(EMPTY_DOCUMENT_UPLOAD);
  const [gdpr, setGdpr] = useState(EMPTY_GDPR);

  const handleItineraryNext = (confirmed: Itinerary) => {
    setItinerary(confirmed);

    setLegDetails((previousLegs) => {
      const rebuiltLegs = buildLegs(confirmed);
      if (previousLegs.length === 0) {
        return rebuiltLegs;
      }

      return rebuiltLegs.map((rebuiltLeg) => {
        const matchedLeg = previousLegs.find(
          (previousLeg) =>
            previousLeg.departureIata === rebuiltLeg.departureIata &&
            previousLeg.arrivalIata === rebuiltLeg.arrivalIata,
        );

        if (!matchedLeg) {
          return rebuiltLeg;
        }

        return {
          ...rebuiltLeg,
          flightDate: matchedLeg.flightDate,
          plannedDepartureTime: matchedLeg.plannedDepartureTime,
          plannedArrivalTime: matchedLeg.plannedArrivalTime,
          flightNumber: matchedLeg.flightNumber,
          airline: matchedLeg.airline,
          reservationNumber: matchedLeg.reservationNumber,
          nextDayArrival: matchedLeg.nextDayArrival,
        };
      });
    });

    setStep(1);
  };

  const currentUser = useMemo(() => getStoredUserIdentity(), []);
  const casesRoute = isColleagueCaseEntry
    ? "/colleague-cases"
    : "/passenger-cases";
  const casesLabel = isColleagueCaseEntry ? "See Cases" : "My Cases";
  const isGuest = currentUser.isGuest;

  const handleLogout = () => {
    localStorage.removeItem("airassist_access_token");
    localStorage.removeItem("airassist_refresh_token");
    clearStoredUserIdentity();
    navigate("/case-entry", { replace: true });
    window.location.reload();
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#ffffff",
        pb: 4,
      }}
    >
      <PortalUserHeader
        name={currentUser.name}
        email={currentUser.email}
        roleLabel={currentUser.roleLabel}
        authAction={
          isGuest
            ? {
                label: "Log In",
                icon: <LoginOutlinedIcon fontSize="small" />,
                onClick: () => navigate("/login"),
              }
            : undefined
        }
        logoutAction={
          isGuest
            ? undefined
            : {
                label: "Log Out",
                icon: <LogoutOutlinedIcon fontSize="small" />,
                onClick: handleLogout,
              }
        }
        actions={[
          {
            label: casesLabel,
            icon: <AssignmentTurnedInOutlinedIcon fontSize="small" />,
            onClick: () => navigate(casesRoute),
          },
          {
            label: "New Claim",
            active: true,
            icon: <AddTaskOutlinedIcon fontSize="small" />,
            onClick: () => navigate("/case-entry"),
          },
        ]}
      />

      <WizardProgressBar steps={wizardSteps} activeStep={step} />
      {step === 0 && (
        <FlightItineraryStep
          value={itinerary}
          onChange={setItinerary}
          onNext={handleItineraryNext}
        />
      )}

      {step === 1 && (
        <FlightDetailsStep
          legs={legDetails}
          onLegsChange={setLegDetails}
          onNext={() => setStep(2)}
          onBack={() => setStep(0)}
        />
      )}
      {step === 2 && (
        <DisruptionStep
          value={disruption}
          onChange={setDisruption}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}
      {step === 3 && (
        <PassangersStep
          data={passenger}
          onChange={setPassenger}
          onBack={() => setStep(2)}
          onFinalize={() => setStep(4)}
        />
      )}

      {step === 4 && (
        <DocumentUploadStep
          data={documents}
          onChange={setDocuments}
          onBack={() => setStep(3)}
          onNext={() => setStep(5)}
        />
      )}

      {step === 5 && (
        <GDPRStep
          data={gdpr}
          onChange={setGdpr}
          onBack={() => setStep(4)}
          onNext={() => {
            setStep(6);
          }}
        />
      )}


      {step === 6 && (
        <OverviewStep
          isColleagueCaseEntry={isColleagueCaseEntry}
          itinerary={itinerary}
          legDetails={legDetails}
          disruption={disruption}
          passenger={passenger}
          documents={documents}
          gdpr={gdpr}
          onBack={() => setStep(5)}
          onEditDisruption={() => setStep(2)}
        />
      )}
    </Box>
  );
}

export default CaseEntryForm;
