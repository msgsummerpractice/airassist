import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import AddCommentOutlined from "@mui/icons-material/AddCommentOutlined";

import { SECTION_ICON_COLOR } from "../../constants";
import type { CaseComment } from "../../types";
import CaseCard from "./CaseCard";

type CommentListCardProps = {
  comments: CaseComment[];
  formatDateTime: (value: string | null | undefined) => string;
};

function CommentListCard({ comments, formatDateTime }: CommentListCardProps) {
  return (
    <CaseCard
      icon={<AddCommentOutlined sx={{ color: SECTION_ICON_COLOR }} />}
      title="Comment List"
    >
      {comments.length === 0 ? (
        <Typography color="text.secondary">No comments yet.</Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Timestamp</TableCell>
                <TableCell>Comment</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {comments.map((comment) => (
                <TableRow key={comment.id}>
                  <TableCell>{comment.author_email}</TableCell>
                  <TableCell>{comment.author_role}</TableCell>
                  <TableCell>{formatDateTime(comment.created_at)}</TableCell>
                  <TableCell sx={{ whiteSpace: "pre-wrap" }}>
                    {comment.text}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </CaseCard>
  );
}

export default CommentListCard;
