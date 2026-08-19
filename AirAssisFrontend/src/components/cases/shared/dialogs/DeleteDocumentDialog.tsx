import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

import type { CaseDocument } from "../../types";

type DeleteDocumentDialogProps = {
  document: CaseDocument | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

function DeleteDocumentDialog({
  document,
  isDeleting,
  onCancel,
  onConfirm,
}: DeleteDocumentDialogProps) {
  return (
    <Dialog open={Boolean(document)} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>Delete Document</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body1">
          Delete document &quot;{document?.filename}&quot;? This action cannot
          be undone.
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

export default DeleteDocumentDialog;
