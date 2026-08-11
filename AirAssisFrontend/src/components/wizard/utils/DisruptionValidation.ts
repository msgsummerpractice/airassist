import type { DisruptionFormData } from "../types/wizardTypes";

export function isDisruptionStepValid(disruption: DisruptionFormData): boolean {
    if (!disruption.motive) {
        return false;
    }
    if(!disruption.incident_description!)
        return false;

    if (disruption.motive === "CANCELATION") {
    return Boolean(disruption.cancellation_type);
    }

    if (disruption.motive === "DELAY") {
    return Boolean(disruption.delay_type);
    }

    if (disruption.motive === "DENIED_BOARDING") {
    if (!disruption.denied_boarding_type) {
        return false;
    }

    if (disruption.denied_boarding_type === "NO") {
        return disruption.denied_boarding_reason.trim().length > 0;
    }

    return true;
    }

    

  return false;
}
