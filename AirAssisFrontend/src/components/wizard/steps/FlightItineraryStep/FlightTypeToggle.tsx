import { Box, Typography, Paper, Radio } from "@mui/material";

interface Props {
  value: "direct" | "connecting";
  onChange: (v: "direct" | "connecting") => void;
}

function FlightTypeToggle({ value, onChange }: Props) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="body1" sx={{ mb: 1 }}>
        Did you have connecting flights? <span style={{ color: "red" }}>*</span>
      </Typography>
      <Box sx={{ display: "flex", gap: 2 }}>
        {(["direct", "connecting"] as const).map((option) => (
          <Paper
            key={option}
            variant="outlined"
            onClick={() => onChange(option)}
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              px: 2,
              py: 1.5,
              cursor: "pointer",
              borderColor: value === option ? "primary.main" : "divider",
              borderWidth: value === option ? 2 : 1,
              backgroundColor:
                value === option ? "primary.main" + "0a" : "transparent",
            }}
          >
            <Radio
              checked={value === option}
              size="small"
              sx={{ p: 0, mr: 1 }}
            />
            <Typography variant="body1">
              {option === "direct" ? "Direct Flight" : "Connecting Flight(s)"}
            </Typography>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}

export default FlightTypeToggle;
