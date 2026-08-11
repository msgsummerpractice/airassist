export interface PassengerData {
  firstName: string;
  lastName: string;
  dateOfBirth: string; // "YYYY-MM-DD"
  email: string;
  phone: string;
  address: string;
  postalCode: string;
}

export const EMPTY_PASSENGER: PassengerData = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  email: "",
  phone: "",
  address: "",
  postalCode: "",
};

export type PassengerFieldErrors = Partial<Record<keyof PassengerData, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[\d\s\-()]{7,15}$/;

export function validatePassengerField(
  field: keyof PassengerData,
  value: string,
): string {
  if (!value.trim()) return "This field is required";

  if (field === "email" && !EMAIL_REGEX.test(value))
    return "Invalid email address";
  if (field === "phone" && !PHONE_REGEX.test(value))
    return "Invalid phone number";
  if (field === "dateOfBirth") {
    const dob = new Date(value);
    if (isNaN(dob.getTime())) return "Invalid date";
    const today = new Date();
    if (dob >= today) return "Date of birth must be in the past";
    const age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (
      age < 18 ||
      (age === 18 && (m < 0 || (m === 0 && today.getDate() < dob.getDate())))
    )
      return "Must be 18 or older to sign a contract";
  }

  return "";
}

export function isPassengerDataValid(data: PassengerData): boolean {
  return (Object.keys(data) as (keyof PassengerData)[]).every(
    (key) => validatePassengerField(key, data[key]) === "",
  );
}
