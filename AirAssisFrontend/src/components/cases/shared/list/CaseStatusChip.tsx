import { Chip } from "@mui/material";

import { formatStatusLabel, type CaseStatus } from "./caseListFormatting";

const getStatusColor = (status: CaseStatus) => {
  switch (status) {
    case "NEW":
      return "info" as const;
    case "VALID":
      return "success" as const;
    case "ASSIGNED":
      return "primary" as const;
    default:
      return "default" as const;
  }
};

const getStatusSx = (status: CaseStatus) => {
  if (status === "NEW") {
    return {
      color: "#2563eb",
      borderColor: "#93c5fd",
      backgroundColor: "#eff6ff",
    };
  }

  if (status === "VALID") {
    return {
      color: "#2e7d32",
      borderColor: "#a5d6a7",
      backgroundColor: "#f1f8e9",
    };
  }

  return undefined;
};

type CaseStatusChipProps = {
  status: CaseStatus;
  preserveStatusCase?: boolean;
};

function CaseStatusChip({
  status,
  preserveStatusCase = false,
}: CaseStatusChipProps) {
  return (
    <Chip
      size="small"
      label={preserveStatusCase ? status : formatStatusLabel(status)}
      color={getStatusColor(status)}
      sx={getStatusSx(status)}
      variant={status === "ASSIGNED" ? "filled" : "outlined"}
    />
  );
}

export default CaseStatusChip;
