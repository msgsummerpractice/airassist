import AddTaskOutlinedIcon from "@mui/icons-material/AddTaskOutlined";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import { Box, Link } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
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
import {
  getStoredUserIdentity,
  logoutToGuestCaseEntry,
} from "../../utils/auth";
import { AppSnackbar } from "../utils/app_snackbar";
import { useAppSnackbar } from "../utils/use_app_snackbar";

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

const CASE_DRAFT_STORAGE_KEY = "airassist-case-draft";

type CaseDraft = {
  step: number;
  itinerary: Itinerary;
  legDetails: Leg[];
  disruption: DisruptionFormData;
  passenger: typeof EMPTY_PASSENGER;
  gdpr: typeof EMPTY_GDPR;
};

function readCaseDraft(storageKey: string): CaseDraft | null {
  try {
    const storedDraft = sessionStorage.getItem(storageKey);
    if (!storedDraft) return null;

    const draft = JSON.parse(storedDraft) as CaseDraft;
    return {
      ...draft,
      legDetails: draft.legDetails.map((leg) => ({
        ...leg,
        flightDate: leg.flightDate ? dayjs(leg.flightDate) : null,
        plannedDepartureTime: leg.plannedDepartureTime
          ? dayjs(leg.plannedDepartureTime)
          : null,
        plannedArrivalTime: leg.plannedArrivalTime
          ? dayjs(leg.plannedArrivalTime)
          : null,
      })),
    };
  } catch {
    sessionStorage.removeItem(storageKey);
    return null;
  }
}

type CaseEntryFormProps = {
  isColleagueCaseEntry?: boolean;
  onShowColleagueDashboard?: () => void;
};

function CaseEntryForm({
  isColleagueCaseEntry = false,
  onShowColleagueDashboard,
}: CaseEntryFormProps) {
  const navigate = useNavigate();
  const currentUser = useMemo(() => getStoredUserIdentity(), []);
  const casesLabel = isColleagueCaseEntry ? "See Cases" : "My Cases";
  const isGuest = currentUser.isGuest;
  const draftStorageKey = `${CASE_DRAFT_STORAGE_KEY}:${
    isColleagueCaseEntry ? "colleague" : "passenger"
  }:${currentUser.email || "guest"}`;

  const savedDraft = useMemo(
    () => readCaseDraft(draftStorageKey),
    [draftStorageKey],
  );
  const [step, setStep] = useState(savedDraft?.step ?? 0);
  const [itinerary, setItinerary] = useState<Itinerary>(
    savedDraft?.itinerary ?? EMPTY_ITINERARY,
  );
  const [legDetails, setLegDetails] = useState<Leg[]>(
    savedDraft?.legDetails ?? [],
  );
  const [disruption, setDisruption] = useState<DisruptionFormData>(
    savedDraft?.disruption ?? defaultDisruption,
  );
  const [passenger, setPassenger] = useState(
    savedDraft?.passenger ?? EMPTY_PASSENGER,
  );
  const [documents, setDocuments] = useState(EMPTY_DOCUMENT_UPLOAD);
  const [gdpr, setGdpr] = useState(savedDraft?.gdpr ?? EMPTY_GDPR);
  const { snackbar, closeSnackbar, showSuccessSnackbar } = useAppSnackbar();

  useEffect(() => {
    const draft: CaseDraft = {
      step,
      itinerary,
      legDetails,
      disruption,
      passenger,
      gdpr,
    };
    sessionStorage.setItem(draftStorageKey, JSON.stringify(draft));
  }, [
    draftStorageKey,
    step,
    itinerary,
    legDetails,
    disruption,
    passenger,
    gdpr,
  ]);

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

  const handleLogout = () => {
    logoutToGuestCaseEntry();
  };

  const resetForm = () => {
    sessionStorage.removeItem(draftStorageKey);
    setStep(0);
    setItinerary(EMPTY_ITINERARY);
    setLegDetails([]);
    setDisruption(defaultDisruption);
    setPassenger(EMPTY_PASSENGER);
    setDocuments(EMPTY_DOCUMENT_UPLOAD);
    setGdpr(EMPTY_GDPR);
  };

  const handleSubmitted = (contractDownloadUrl: string | null) => {
    showSuccessSnackbar(
      contractDownloadUrl ? (
        <>
          Case submitted successfully.{" "}
          <Link
            href={contractDownloadUrl}
            target="_blank"
            rel="noreferrer"
            underline="always"
            color="inherit"
            sx={{ fontWeight: 700 }}
          >
            Download contract PDF
          </Link>
        </>
      ) : (
        "Case submitted successfully."
      ),
    );
    resetForm();
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
        onLogoClick={isGuest ? () => setStep(0) : undefined}
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
            onClick: () => {
              if (isColleagueCaseEntry) {
                onShowColleagueDashboard?.();
                return;
              }

              navigate("/passenger-cases");
            },
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
          isLoggedIn={!isGuest}
          loggedInEmail={
            !isColleagueCaseEntry && !isGuest ? currentUser.email : ""
          }
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
          onSubmitted={handleSubmitted}
        />
      )}

      <AppSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </Box>
  );
}

export default CaseEntryForm;
