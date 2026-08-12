import { useState } from "react";
import FlightItineraryStep from "./steps/FlightItineraryStep";
import FlightDetailsStep from "./steps/FlightDetailsStep";
import DisruptionStep from "./steps/DisruptionStep";
import {
  type Itinerary,
  type Leg,
  type DisruptionFormData,
  buildLegs,
} from "./types/wizardTypes";

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

  const handleItineraryNext = (confirmed: Itinerary) => {
    setLegDetails(buildLegs(confirmed));
    setStep(1);
  };

  return (
    <>
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
        <DisruptionStep value={disruption} onChange={setDisruption} />
      )}
    </>
  );
}

export default CaseEntryForm;
