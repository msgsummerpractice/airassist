import type { DisruptionFormData } from "../types/wizardTypes";

export type DisruptionFieldErrors = Partial<
  Record<keyof DisruptionFormData, string>
>;

export function validateDisruptionStep(
  disruption: DisruptionFormData,
): DisruptionFieldErrors {
  const errors: DisruptionFieldErrors = {};

  if (!disruption.motive) {
    errors.motive = "Disruption type is required";
  }

  if (!disruption.incident_description.trim()) {
    errors.incident_description = "Additional information is required";
  }

  if (disruption.motive === "CANCELATION" && !disruption.cancellation_type) {
    errors.cancellation_type = "Cancellation timing is required";
  }

  if (disruption.motive === "DELAY" && !disruption.delay_type) {
    errors.delay_type = "Delay length is required";
  }

  if (
    disruption.motive === "DENIED_BOARDING" &&
    !disruption.denied_boarding_type
  ) {
    errors.denied_boarding_type =
      "Please select whether you gave up your seat voluntarily";
  }

  if (
    disruption.motive === "DENIED_BOARDING" &&
    disruption.denied_boarding_type === "NO" &&
    !disruption.denied_boarding_reason.trim()
  ) {
    errors.denied_boarding_reason = "Denied boarding reason is required";
  }

  return errors;
}

export function isDisruptionStepValid(disruption: DisruptionFormData): boolean {
  return Object.keys(validateDisruptionStep(disruption)).length === 0;
}
