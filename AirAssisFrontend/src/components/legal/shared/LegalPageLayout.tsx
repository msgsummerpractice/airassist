import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import { Box, Button, Stack, Typography } from "@mui/material";

export type LegalSection = {
  heading: string;
  body: ReactNode;
};

type LegalPageLayoutProps = {
  title: string;
  lastUpdated: string;
  intro?: ReactNode;
  sections: LegalSection[];
};

function LegalPageLayout({
  title,
  lastUpdated,
  intro,
  sections,
}: LegalPageLayoutProps) {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        maxWidth: 760,
        width: "100%",
        mx: "auto",
        px: { xs: 3, md: 0 },
        py: { xs: 5, md: 8 },
        textAlign: "left",
      }}
    >
      <Button
        startIcon={<ArrowBackOutlinedIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 4, px: 0, justifyContent: "flex-start" }}
      >
        Back
      </Button>

      <Stack spacing={0.75} sx={{ mb: 5 }}>
        <Typography variant="h1" sx={{ textAlign: "left" }}>
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Last updated: {lastUpdated}
        </Typography>
      </Stack>

      {intro ? (
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 6, maxWidth: 640, textAlign: "left" }}
        >
          {intro}
        </Typography>
      ) : null}

      <Stack spacing={5}>
        {sections.map((section) => (
          <Box key={section.heading} sx={{ textAlign: "left" }}>
            <Typography variant="h2" sx={{ mb: 1.5, textAlign: "left" }}>
              {section.heading}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              component="div"
              sx={{ textAlign: "left" }}
            >
              {section.body}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

export default LegalPageLayout;
