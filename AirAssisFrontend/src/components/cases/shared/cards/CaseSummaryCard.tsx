import { Box, Chip, Stack, Typography } from "@mui/material";
import SummarizeOutlined from "@mui/icons-material/SummarizeOutlined";

import { SECTION_ICON_COLOR } from "../../constants";
import type { CaseDetails } from "../../types";
import CaseCard from "./CaseCard";

const statusColor = (status: string) => {
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

const statusSx = (status: string) => {
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

type CaseSummaryCardProps = {
  details: CaseDetails;
  formatDateTime: (value: string | null | undefined) => string;
};

function CaseSummaryCard({ details, formatDateTime }: CaseSummaryCardProps) {
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
            label={details.status}
            color={statusColor(details.status)}
            sx={statusSx(details.status)}
            variant={details.status === "ASSIGNED" ? "filled" : "outlined"}
          />
        </Box>
        <Typography>Created: {formatDateTime(details.created_at)}</Typography>
      </Stack>
    </CaseCard>
  );
}

export default CaseSummaryCard;
