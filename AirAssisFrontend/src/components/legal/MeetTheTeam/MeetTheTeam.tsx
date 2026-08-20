import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

function MeetTheTeam() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        maxWidth: 960,
        width: "100%",
        mx: "auto",
        px: { xs: 3, md: 4 },
        py: { xs: 5, md: 8 },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 4 }}>
        <Button
          startIcon={<ArrowBackOutlinedIcon />}
          onClick={() => navigate(-1)}
          sx={{ px: 0 }}
        >
          Back
        </Button>
      </Box>

      <Stack
        spacing={1}
        sx={{ mb: 4, maxWidth: 650, mx: "auto", textAlign: "center" }}
      >
        <Typography variant="h1" sx={{ textAlign: "center" }}>
          Meet the Team
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ textAlign: "center" }}
        >
          The people behind AIR-ASSIST.EU.
        </Typography>
      </Stack>

      <Box
        component="img"
        src="/image.png"
        alt="The AIR-ASSIST.EU team"
        sx={{
          display: "block",
          width: "100%",
          aspectRatio: { xs: "4 / 3", md: "16 / 9" },
          objectFit: "cover",
          objectPosition: "center",
          borderRadius: 1,
          boxShadow: 1,
        }}
      />
    </Box>
  );
}

export default MeetTheTeam;
