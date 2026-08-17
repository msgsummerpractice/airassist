import { Alert, Box, CircularProgress, Typography } from "@mui/material";

type CaseListLoadingStateProps = {
  label: string;
};

export function CaseListLoadingState({ label }: CaseListLoadingStateProps) {
  return (
    <Box
      sx={{
        py: 8,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 1,
      }}
    >
      <CircularProgress size={28} />
      <Typography variant="body1" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}

type CaseListEmptyStateProps = {
  message?: string;
};

export function CaseListEmptyState({
  message = "No cases found for current filters.",
}: CaseListEmptyStateProps) {
  return (
    <Box
      sx={{
        py: 6,
        borderRadius: 2,
        border: "1px dashed",
        borderColor: "divider",
        textAlign: "center",
      }}
    >
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}

type CaseListErrorStateProps = {
  message: string;
};

export function CaseListErrorState({ message }: CaseListErrorStateProps) {
  return <Alert severity="error">{message}</Alert>;
}
