import { useState } from "react";
import FlightItineraryStep from "./steps/FlightItineraryStep";
import FlightDetailsStep from "./steps/FlightDetailsStep";
import DisruptionStep from "./steps/DisruptionStep";
import {
  type Itinerary,
  type Leg,
  type DisruptionFormData,
  EMPTY_PASSENGER,
  EMPTY_DOCUMENT_UPLOAD,
  EMPTY_GDPR,
  buildLegs,
} from "./types/wizardTypes";
import PassangersStep from "./steps/PassangersStep";
import DocumentUploadStep from "./steps/DocumentUploadStep";
import GDPRStep from "./steps/GDPRStep";
import WizardProgressBar from "./WizardProgressBar";

const wizardSteps = [
  "Itinerary",
  "Flight Details",
  "Disruption",
  "Passenger",
  "Documents",
  "Consent",
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



function CaseEntryForm() {
  const [step, setStep] = useState(0);
  const [legDetails, setLegDetails] = useState<Leg[]>([]);
  const [disruption, setDisruption] =
    useState<DisruptionFormData>(defaultDisruption);
  const [passenger, setPassenger] = useState(EMPTY_PASSENGER);
  const [documents, setDocuments] = useState(EMPTY_DOCUMENT_UPLOAD);
  const [gdpr, setGdpr] = useState(EMPTY_GDPR);

  const handleItineraryNext = (confirmed: Itinerary) => {
    setLegDetails(buildLegs(confirmed));
    setStep(1);
  };

  return (
    <>
        <WizardProgressBar steps={wizardSteps} activeStep={step} />
        {step === 0 && <FlightItineraryStep onNext={handleItineraryNext} />}
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
                onNext={() => setStep(3)}/>
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
                // final submit later
                }}
            />
            )}
    </>
  );
}

export default CaseEntryForm;
