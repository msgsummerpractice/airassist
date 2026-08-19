import { Avatar, Box, Chip, Stack, Typography } from "@mui/material";
import AccessTimeOutlined from "@mui/icons-material/AccessTimeOutlined";

import type { CaseComment } from "../../types";

type CommentListBodyProps = {
  comments: CaseComment[];
  formatDateTime: (value: string | null | undefined) => string;
};

function CommentListBody({ comments, formatDateTime }: CommentListBodyProps) {
  if (comments.length === 0) {
    return <Typography color="text.secondary">No comments yet.</Typography>;
  }

  return (
    <Stack spacing={2}>
      {comments.map((comment) => {
        const authorLabel = comment.author_email?.trim() || "Unknown user";
        const authorInitial = authorLabel.charAt(0).toUpperCase();
        const roleLabel = comment.author_role?.trim() || "User";
        const isPassenger = roleLabel.toUpperCase() === "PASSENGER";

        return (
          <Box
            key={comment.id}
            sx={{
              display: "grid",
              gridTemplateColumns: "36px minmax(0, 1fr)",
              gap: { xs: 1.25, sm: 1.5 },
              alignItems: "start",
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                mt: 0.25,
                backgroundColor: "#d7e2f6",
                color: "#315486",
                fontSize: "0.875rem",
                fontWeight: 700,
              }}
            >
              {authorInitial}
            </Avatar>

            <Box
              sx={{
                minWidth: 0,
                border: "1px solid",
                borderColor: isPassenger ? "#bfe3c8" : "#e5e9f2",
                borderRadius: 1.5,
                backgroundColor: isPassenger ? "#eaf7ee" : "#f8f9fd",
                px: { xs: 1.5, sm: 2 },
                py: { xs: 1.25, sm: 1.5 },
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={{ xs: 0.5, sm: 1 }}
                sx={{
                  alignItems: { sm: "center" },
                  justifyContent: "space-between",
                  mb: 1,
                }}
              >
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: "center", minWidth: 0 }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontSize: { xs: "0.875rem", sm: "0.9375rem" },
                      fontWeight: 700,
                    }}
                  >
                    {authorLabel}
                  </Typography>
                  <Chip
                    size="small"
                    label={roleLabel.toUpperCase()}
                    sx={{
                      height: 18,
                      flexShrink: 0,
                      backgroundColor: isPassenger ? "#2e7d32" : "#1554ad",
                      color: "#ffffff",
                      fontSize: "0.625rem",
                      fontWeight: 700,
                      letterSpacing: "0.03em",
                      "& .MuiChip-label": { px: 1 },
                    }}
                  />
                </Stack>
                <Stack
                  direction="row"
                  spacing={0.5}
                  sx={{
                    alignItems: "center",
                    color: "#64748b",
                    flexShrink: 0,
                  }}
                >
                  <AccessTimeOutlined sx={{ fontSize: 14 }} />
                  <Typography variant="caption" sx={{ fontWeight: 500 }}>
                    {formatDateTime(comment.created_at)}
                  </Typography>
                </Stack>
              </Stack>
              <Typography
                variant="body1"
                sx={{
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                  textAlign: "left",
                  color: "text.primary",
                  fontSize: { xs: "0.9375rem", sm: "1rem" },
                  lineHeight: 1.55,
                }}
              >
                {comment.text}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
}

export default CommentListBody;
