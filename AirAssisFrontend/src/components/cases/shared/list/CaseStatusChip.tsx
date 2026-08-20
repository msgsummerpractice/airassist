import { Chip } from "@mui/material";

import { getCaseStatusPresentation } from "../../../../utils/caseStatus";
import { formatStatusLabel, type CaseStatus } from "./caseListFormatting";

type CaseStatusChipProps = {
  status: CaseStatus;
  preserveStatusCase?: boolean;
};

function CaseStatusChip({
  status,
  preserveStatusCase = false,
}: CaseStatusChipProps) {
  const statusPresentation = getCaseStatusPresentation(status);

  return (
    <Chip
      size="small"
      label={
        preserveStatusCase
          ? status
          : statusPresentation.label === status
            ? formatStatusLabel(status)
            : statusPresentation.label
      }
      color={statusPresentation.color}
      sx={statusPresentation.sx}
      variant="outlined"
    />
  );
}

export default CaseStatusChip;
