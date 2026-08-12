import type { GDPRData } from "../types/wizardTypes";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateGDPREmail(value: string): string {
  if (!value.trim()) return "This field is required";
  if (!EMAIL_REGEX.test(value)) return "Invalid email address";
  return "";
}

export function isGDPRDataValid(data: GDPRData): boolean {
  return validateGDPREmail(data.email) === "" && data.gdprConsent;
}
