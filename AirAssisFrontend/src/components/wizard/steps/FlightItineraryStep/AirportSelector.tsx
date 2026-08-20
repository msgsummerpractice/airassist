import { Box, IconButton } from "@mui/material";
import { SwapHoriz as SwapHorizIcon } from "@mui/icons-material";
import AirportAutocomplete, { type AirportOption } from "./AirportAutoComplete";
import FlightLandIcon from "@mui/icons-material/FlightLand";
import FLightTakeoffIcon from "@mui/icons-material/FlightTakeoff";

interface Props {
  departing: AirportOption | null;
  destination: AirportOption | null;
  onDepartingChange: (value: AirportOption | null) => void;
  onDestinationChange: (value: AirportOption | null) => void;
  onSwap: () => void;
  errors?: string;
  errorDestination?: string;
}

function AirportSelector({
  departing,
  destination,
  onDepartingChange,
  onDestinationChange,
  onSwap,
  errors,
  errorDestination,
}: Props) {
  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 3 }}>
      <AirportAutocomplete
        label="Departing Airport"
        placeholder="e.g. LAX or Los Angeles International"
        value={departing}
        onChange={onDepartingChange}
        error={errors}
        icon={<FLightTakeoffIcon fontSize="small" />}
      />
      <IconButton
        size="small"
        sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}
        aria-label="Switch airports"
        title="Switch airports"
        onClick={onSwap}
      >
        <SwapHorizIcon />
      </IconButton>
      <AirportAutocomplete
        label="Destination Airport"
        placeholder="e.g. JFK or John F. Kennedy International"
        value={destination}
        onChange={onDestinationChange}
        error={errorDestination}
        icon={<FlightLandIcon fontSize="small" />}
      />
    </Box>
  );
}

export default AirportSelector;
