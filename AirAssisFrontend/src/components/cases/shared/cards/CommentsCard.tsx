import type { ReactNode } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddCommentOutlined from "@mui/icons-material/AddCommentOutlined";
import SendOutlined from "@mui/icons-material/SendOutlined";

import { COMMENT_MAX_LENGTH, SECTION_ICON_COLOR } from "../../constants";
import type { CaseComment } from "../../types";
import CommentListBody from "./CommentListBody";

type CommentsCardProps = {
  comments: CaseComment[];
  formatDateTime: (value: string | null | undefined) => string;
  commentText: string;
  setCommentText: (value: string) => void;
  isSubmitting: boolean;
  errorMessage: string;
  successMessage: string;
  submitComment: () => void | Promise<void>;
  clearMessages: () => void;
  disabled?: boolean;
  disabledMessage?: string;
  headerAction?: ReactNode;
};

function CommentsCard({
  comments,
  formatDateTime,
  commentText,
  setCommentText,
  isSubmitting,
  errorMessage,
  successMessage,
  submitComment,
  clearMessages,
  disabled = false,
  disabledMessage,
  headerAction,
}: CommentsCardProps) {
  const trimmedLength = commentText.trim().length;
  const canSubmit =
    !disabled &&
    trimmedLength > 0 &&
    trimmedLength <= COMMENT_MAX_LENGTH &&
    !isSubmitting;

  return (
    <Card variant="outlined" sx={{ overflow: "hidden" }}>
      <Box sx={{ backgroundColor: "#eaf1fc", p: { xs: 2, sm: 3 } }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{
            alignItems: { sm: "center" },
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <AddCommentOutlined sx={{ color: SECTION_ICON_COLOR }} />
            <Typography variant="h5">Comments</Typography>
          </Stack>
          {headerAction}
        </Stack>

        {disabled && disabledMessage && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {disabledMessage}
          </Alert>
        )}

        <TextField
          fullWidth
          multiline
          minRows={4}
          maxRows={12}
          value={commentText}
          disabled={disabled}
          onChange={(event) => {
            setCommentText(event.target.value);
            clearMessages();
          }}
          placeholder="Add an internal note or update the case history..."
          slotProps={{ htmlInput: { maxLength: COMMENT_MAX_LENGTH } }}
          sx={{ backgroundColor: "#ffffff", borderRadius: 1 }}
        />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{
            mt: 1.5,
            alignItems: { sm: "center" },
            justifyContent: "space-between",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {commentText.length}/{COMMENT_MAX_LENGTH}
          </Typography>
          <Button
            variant="contained"
            color="success"
            startIcon={<SendOutlined fontSize="small" />}
            onClick={() => void submitComment()}
            disabled={!canSubmit}
          >
            {isSubmitting ? "Posting..." : "Post Update"}
          </Button>
        </Stack>

        {errorMessage && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {errorMessage}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {successMessage}
          </Alert>
        )}
      </Box>

      <Divider />

      <CardContent>
        <CommentListBody comments={comments} formatDateTime={formatDateTime} />
      </CardContent>
    </Card>
  );
}

export default CommentsCard;
