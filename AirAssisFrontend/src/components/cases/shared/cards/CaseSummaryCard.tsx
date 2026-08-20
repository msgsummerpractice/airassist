import { Box, Chip, Stack, Typography } from "@mui/material";
import SummarizeOutlined from "@mui/icons-material/SummarizeOutlined";

import { SECTION_ICON_COLOR } from "../../constants";
import type { CaseDetails } from "../../types";
import { getCaseStatusPresentation } from "../../../../utils/caseStatus";
import CaseCard from "./CaseCard";

type CaseSummaryCardProps = {
  details: CaseDetails;
  formatDateTime: (value: string | null | undefined) => string;
};

function CaseSummaryCard({ details, formatDateTime }: CaseSummaryCardProps) {
  const statusPresentation = getCaseStatusPresentation(details.status);

  return (
    <CaseCard
      icon={<SummarizeOutlined sx={{ color: SECTION_ICON_COLOR }} />}
      title="Summary"
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ justifyContent: "space-between" }}
      >
        <Typography>
          Case ID:
          <Box
            component="span"
            sx={{
              color: SECTION_ICON_COLOR,
              backgroundColor: "rgba(0, 49, 120, 0.04)",
              borderRadius: 1,
              px: 1,
              py: 0.5,
              fontWeight: 500,
            }}
          >
            #{details.id}
          </Box>
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography>Status:</Typography>
          <Chip
            size="small"
            label={statusPresentation.label}
            color={statusPresentation.color}
            sx={statusPresentation.sx}
            variant="outlined"
          />
        </Box>
        <Typography>Created: {formatDateTime(details.created_at)}</Typography>
      </Stack>
    </CaseCard>
  );
}

export default CaseSummaryCard;
