import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

import type { AdminCaseListItem } from "../cases/api";

type DeleteCaseDialogProps = {
  caseItem: AdminCaseListItem | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

function DeleteCaseDialog({
  caseItem,
  isDeleting,
  onCancel,
  onConfirm,
}: DeleteCaseDialogProps) {
  return (
    <Dialog open={Boolean(caseItem)} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>Delete Case</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body1">
          Delete case #{caseItem?.id}? This permanently removes its flights,
          passenger data, documents, and comments.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onCancel} disabled={isDeleting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={isDeleting}
          startIcon={
            isDeleting ? (
              <CircularProgress size={16} color="inherit" />
            ) : undefined
          }
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default DeleteCaseDialog;
