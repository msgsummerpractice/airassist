import {
  Box,
  Typography,
  TextField,
  IconButton,
  Button,
  Chip,
  Radio,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

import AirportAutoComplete, { type AirportOption } from "./AirportAutoComplete";

interface Props {
  connections: (AirportOption | null)[];
  onChange: (connections: (AirportOption | null)[]) => void;
  departingAirport: string;
  destinationAirport: string;
  disruptedLeg: number | null;
  onDisruptedLegChange: (index: number) => void;
  connectionErrors?: (string | undefined)[];
  disruptedLegError?: string;
}

function ConnectionsPanel({
  connections,
  onChange,
  departingAirport,
  destinationAirport,
  disruptedLeg,
  onDisruptedLegChange,
  connectionErrors,
  disruptedLegError,
}: Props) {
  const allAirports = [departingAirport, ...connections, destinationAirport];

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        p: 2,
        mb: 3,
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          Connections
        </Typography>
        <Chip label="Max 4" size="small" variant="outlined" />
      </Box>

      {allAirports.map((airport, airportIndex) => {
        const isEndpoint =
          airportIndex === 0 || airportIndex === allAirports.length - 1;
        const connectionIndex = airportIndex - 1;

        return (
          <Box key={airportIndex}>
            {/* ── Airport row ── */}
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}
            >
              {/* timeline dot */}
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  flexShrink: 0,
                  bgcolor: isEndpoint ? "primary.main" : "primary.light",
                  border: "2px solid",
                  borderColor: "primary.main",
                }}
              />

              {isEndpoint ? (
                <TextField
                  fullWidth
                  size="small"
                  value={airport}
                  disabled
                  placeholder={
                    airportIndex === 0
                      ? "Departing airport"
                      : "Destination airport"
                  }
                />
              ) : (
                <AirportAutoComplete
                  label="Connection"
                  placeholder="e.g. FRA"
                  value={connections[connectionIndex]}
                  onChange={(option) => {
                    const updated = [...connections];
                    updated[connectionIndex] = option;
                    onChange(updated);
                  }}
                  error={connectionErrors?.[connectionIndex]}
                />
              )}

              {!isEndpoint && (
                <IconButton
                  size="small"
                  color="error"
                  disabled={connections.length === 1}
                  onClick={() =>
                    onChange(
                      connections.filter((_, i) => i !== connectionIndex),
                    )
                  }
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>

            {/* ── Leg row (between this airport and the next) ── */}
            {airportIndex < allAirports.length - 1 && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  pl: "3px",
                  my: 0.5,
                }}
              >
                {/* vertical line */}
                <Box
                  sx={{
                    borderLeft: "2px dashed",
                    borderColor: "divider",
                    mx: "5px",
                    alignSelf: "stretch",
                    width: 0,
                  }}
                />
                {/* spacer pushes radio to the right */}
                <Box sx={{ flex: 1 }} />
                <Radio
                  size="small"
                  checked={disruptedLeg === airportIndex}
                  onChange={() => onDisruptedLegChange(airportIndex)}
                  sx={{ p: 0, mr: 0.5 }}
                />
                <Typography
                  variant="caption"
                  color={disruptedLegError ? "error" : "text.secondary"}
                >
                  Disrupted
                </Typography>
              </Box>
            )}
          </Box>
        );
      })}

      <Button
        fullWidth
        variant="outlined"
        disabled={connections.length >= 4}
        sx={{ mt: 2, borderStyle: "dashed" }}
        onClick={() => onChange([...connections, null])}
      >
        + Add Connection
      </Button>

      {disruptedLegError && (
        <Typography
          variant="caption"
          color="error"
          sx={{ display: "block", mt: 1 }}
        >
          {disruptedLegError}
        </Typography>
      )}
    </Box>
  );
}

export default ConnectionsPanel;
