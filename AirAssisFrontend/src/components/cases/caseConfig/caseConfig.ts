import type { CaseScope } from "../types";

export type CaseDetailsConfig = {
  scope: CaseScope;
  casesLabel: string;
  createCaseLabel?: string;
  listPath: string;
  description: string;
  canAddComments?: boolean;
};

export const passengerCaseConfig: CaseDetailsConfig = {
  scope: "passenger",
  casesLabel: "My Cases",
  createCaseLabel: "New Claim",
  listPath: "/passenger-cases",
  description:
    "Review flight, passenger, and attached documents for this case.",
};

export const colleagueCaseConfig: CaseDetailsConfig = {
  scope: "colleague",
  casesLabel: "See Cases",
  createCaseLabel: "Create Case",
  listPath: "/colleague-cases",
  description:
    "Review flight, passenger, and attached documents for this case.",
};

export const adminCaseConfig: CaseDetailsConfig = {
  scope: "admin",
  casesLabel: "Case View",
  listPath: "/admin/cases",
  description:
    "Review the case record, passengers, flights, documents, and comments.",
  canAddComments: false,
};
