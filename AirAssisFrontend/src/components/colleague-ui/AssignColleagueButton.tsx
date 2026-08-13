import { useState } from "react";

import AssignmentIndOutlinedIcon from "@mui/icons-material/AssignmentIndOutlined";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";

import { fetchWithAuth } from "../../utils/auth";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export type ColleagueOption = {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
};

type AssignColleagueButtonProps = {
  caseId: number;
  caseStatus: string;
  colleagues: ColleagueOption[];
  assignedColleagueId?: number | null;
  onAssigned?: () => void;
};

function getColleagueLabel(colleague: ColleagueOption) {
  return `${colleague.firstname} ${colleague.lastname}`.trim() || colleague.email;
}

function AssignColleagueButton({
  caseId,
  caseStatus,
  colleagues,
  assignedColleagueId,
  onAssigned,
}: AssignColleagueButtonProps) {
  const [open, setOpen] = useState(false);
  const [assigningColleagueId, setAssigningColleagueId] = useState<number | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const canAssign = caseStatus === "VALID";

  const handleAssign = async (colleague: ColleagueOption) => {
    setAssigningColleagueId(colleague.id);
    setError(null);

    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/cases/${caseId}/assign/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            colleague_id: colleague.id,
          }),
        },
      );

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message ?? "Could not assign this case.");
      }

      setOpen(false);
      onAssigned?.();
    } catch (assignError) {
      setError(
        assignError instanceof Error
          ? assignError.message
          : "Could not assign this case.",
      );
    } finally {
      setAssigningColleagueId(null);
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={<AssignmentIndOutlinedIcon />}
        disabled={!canAssign}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        Assign
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Assign case</DialogTitle>

        <DialogContent dividers>
          <Stack spacing={1.5}>
            {error ? (
              <Alert severity="error" variant="outlined">
                {error}
              </Alert>
            ) : null}

            {colleagues.length === 0 ? (
              <Alert severity="info" variant="outlined">
                No colleagues are available.
              </Alert>
            ) : (
              colleagues.map((colleague) => {
                const isCurrentAssignee = colleague.id === assignedColleagueId;
                const isAssigning = assigningColleagueId === colleague.id;

                return (
                  <Button
                    key={colleague.id}
                    variant={isCurrentAssignee ? "contained" : "outlined"}
                    color={isCurrentAssignee ? "primary" : "inherit"}
                    fullWidth
                    disabled={assigningColleagueId !== null}
                    onClick={() => handleAssign(colleague)}
                    sx={{
                      justifyContent: "space-between",
                      textAlign: "left",
                      py: 1.25,
                    }}
                  >
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {getColleagueLabel(colleague)}
                      </Typography>

                      <Typography variant="caption" color="text.secondary">
                        {colleague.email}
                        {isCurrentAssignee ? " · Currently assigned" : ""}
                      </Typography>
                    </Box>

                    {isAssigning ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : null}
                  </Button>
                );
              })
            )}
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AssignColleagueButton;