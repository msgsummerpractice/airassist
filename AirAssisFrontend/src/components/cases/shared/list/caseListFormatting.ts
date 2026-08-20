export type CaseStatus =
  | "PENDING"
  | "IN_REVIEW"
  | "ELIGIBLE"
  | "NON_ELIGIBLE"
  | "AWAITING_DOCUMENTS"
  | string;

export const formatStatusLabel = (status: CaseStatus) =>
  status.charAt(0) + status.slice(1).toLowerCase();

export const formatCaseDate = (value: string | null | undefined) => {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};
