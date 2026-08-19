import { Box, Divider, Link, Stack, Typography } from "@mui/material";

const legalLinks = [
  ["Privacy Policy", "#privacy-policy"],
  ["Terms of Service", "#terms-of-service"],
  ["Imprint", "#imprint"],
  ["EU 261/2004 Info", "#eu-261-2004"],
];

function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: "#e8f0ff",
        borderTop: "3px solid",
        borderColor: "primary.main",
        px: { xs: 3, sm: 5, lg: 7 },
        py: { xs: 4, sm: 4.5 },
      }}
    >
      <Box
        sx={{
          margin: "0 auto",
          maxWidth: "1440px",
        }}
      >
        <Box
          sx={{
            alignItems: { xs: "flex-start", md: "center" },
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: { xs: 2.5, md: 4 },
            justifyContent: "space-between",
          }}
        >
          <Typography
            color="primary.main"
            sx={{
              fontSize: "1.125rem",
              fontWeight: 800,
              letterSpacing: "0.02em",
              lineHeight: 1.25,
            }}
          >
            AIR-ASSIST.EU
          </Typography>

          <Stack
            aria-label="Legal information"
            component="nav"
            direction="row"
            spacing={{ xs: 2.5, sm: 3.5 }}
            sx={{ flexWrap: "wrap", rowGap: 1.25 }}
          >
            {legalLinks.map(([label, href]) => (
              <Link
                href={href}
                key={href}
                sx={{
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  lineHeight: 1.5,
                  whiteSpace: "nowrap",
                  color: "#26436e",
                  "&:hover": { color: "primary.main" },
                }}
                underline="hover"
              >
                {label}
              </Link>
            ))}
          </Stack>
        </Box>

        <Divider
          sx={{ borderColor: "rgba(0, 49, 120, 0.2)", my: { xs: 2, sm: 2.5 } }}
        />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={{ xs: 0.25, sm: 1.25 }}
          sx={{ alignItems: { xs: "flex-start", sm: "center" } }}
        >
          <Typography
            color="text.secondary"
            sx={{ fontSize: "0.75rem" }}
            variant="caption"
          >
            {`© ${new Date().getFullYear()} AIR-ASSIST.EU. All rights reserved.`}
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ fontSize: "0.75rem" }}
            variant="caption"
          >
            In accordance with EU Regulation 261/2004.
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}

export default Footer;
