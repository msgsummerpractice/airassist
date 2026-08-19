import AddCommentOutlined from "@mui/icons-material/AddCommentOutlined";

import { SECTION_ICON_COLOR } from "../../constants";
import type { CaseComment } from "../../types";
import CaseCard from "./CaseCard";
import CommentListBody from "./CommentListBody";

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
      <CommentListBody comments={comments} formatDateTime={formatDateTime} />
    </CaseCard>
  );
}

export default CommentListCard;
