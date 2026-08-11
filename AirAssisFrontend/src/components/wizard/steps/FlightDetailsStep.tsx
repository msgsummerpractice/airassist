import { Box, Card, CardContent, Typography } from "@mui/material";

function FlightDetailsStep() {
  return (
    <Box sx={{ maxWidth: 760, mx: "auto", px: { xs: 2, md: 4 }, py: 3 }}>
      <Card>
        {" "}
        <CardContent sx={{ p: { xs: 2, md: 4 } }}>
          {/* Step title */}
          <Typography variant="h2" sx={{ textAlign: "left", mb: 1 }}>
            Flight Details
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 3, fontSize: "0.875rem", textAlign: "left" }}
          >
            Please provide the specifics for each leg of your disrupted journey.
            This information is crucial for determining EU 261/2004 eligibility.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
export default FlightDetailsStep;
