import { Alert, Button, Stack, TextField, Typography } from "@mui/material";
import AddCommentOutlined from "@mui/icons-material/AddCommentOutlined";

import { COMMENT_MAX_LENGTH, SECTION_ICON_COLOR } from "../../constants";
import CaseCard from "./CaseCard";

type AddCommentCardProps = {
  commentText: string;
  setCommentText: (value: string) => void;
  isSubmitting: boolean;
  errorMessage: string;
  successMessage: string;
  submitComment: () => Promise<void>;
  clearMessages: () => void;
};

function AddCommentCard({
  commentText,
  setCommentText,
  isSubmitting,
  errorMessage,
  successMessage,
  submitComment,
  clearMessages,
}: AddCommentCardProps) {
  return (
    <CaseCard
      icon={<AddCommentOutlined sx={{ color: SECTION_ICON_COLOR }} />}
      title="Add Comment"
    >
      <TextField
        fullWidth
        multiline
        minRows={5}
        maxRows={12}
        value={commentText}
        onChange={(event) => {
          setCommentText(event.target.value);
          clearMessages();
        }}
        placeholder="Add your additional information or question here..."
        slotProps={{ htmlInput: { maxLength: COMMENT_MAX_LENGTH } }}
      />
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ mt: 1.5, alignItems: { sm: "center" } }}
      >
        <Typography variant="body2" color="text.secondary">
          {commentText.length}/{COMMENT_MAX_LENGTH}
        </Typography>
        <Button
          variant="contained"
          onClick={() => void submitComment()}
          disabled={
            !commentText.trim() ||
            commentText.trim().length > COMMENT_MAX_LENGTH ||
            isSubmitting
          }
        >
          {isSubmitting ? "Adding..." : "Add Comment"}
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
    </CaseCard>
  );
}

export default AddCommentCard;
