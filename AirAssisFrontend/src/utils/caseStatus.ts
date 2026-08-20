import type { ChipProps } from "@mui/material";

type CaseStatusChipColor = NonNullable<ChipProps["color"]>;

const CASE_STATUS_PRESENTATION: Record<
  string,
  {
    label: string;
    color: CaseStatusChipColor;
    sx: { color: string; borderColor: string; backgroundColor: string };
  }
> = {
  NEW: {
    label: "New",
    color: "info",
    sx: {
      color: "#2563eb",
      borderColor: "#93c5fd",
      backgroundColor: "#eff6ff",
    },
  },
  VALID: {
    label: "Valid",
    color: "success",
    sx: {
      color: "#2e7d32",
      borderColor: "#a5d6a7",
      backgroundColor: "#f1f8e9",
    },
  },
  ASSIGNED: {
    label: "Assigned",
    color: "primary",
    sx: {
      color: "#003178",
      borderColor: "#90caf9",
      backgroundColor: "#e3f2fd",
    },
  },
  PENDING: {
    label: "Pending",
    color: "default",
    sx: {
      color: "#475569",
      borderColor: "#cbd5e1",
      backgroundColor: "#f1f5f9",
    },
  },
  IN_REVIEW: {
    label: "In review",
    color: "info",
    sx: {
      color: "#2563eb",
      borderColor: "#93c5fd",
      backgroundColor: "#eff6ff",
    },
  },
  ELIGIBLE: {
    label: "Eligible",
    color: "success",
    sx: {
      color: "#2e7d32",
      borderColor: "#a5d6a7",
      backgroundColor: "#f1f8e9",
    },
  },
  NON_ELIGIBLE: {
    label: "Non-eligible",
    color: "error",
    sx: {
      color: "#ba1a1a",
      borderColor: "#ef9a9a",
      backgroundColor: "#ffebee",
    },
  },
  AWAITING_DOCUMENTS: {
    label: "Awaiting documents",
    color: "warning",
    sx: {
      color: "#6c4300",
      borderColor: "#ffcc80",
      backgroundColor: "#fff8e1",
    },
  },
};

const DEFAULT_CASE_STATUS_PRESENTATION = {
  label: "Unknown",
  color: "default" as CaseStatusChipColor,
  sx: {
    color: "#434652",
    borderColor: "#c3c6d4",
    backgroundColor: "#ffffff",
  },
};

export function getCaseStatusPresentation(status: string) {
  return (
    CASE_STATUS_PRESENTATION[status] ?? {
      ...DEFAULT_CASE_STATUS_PRESENTATION,
      label: status
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/^./, (value) => value.toUpperCase()),
    }
  );
}
