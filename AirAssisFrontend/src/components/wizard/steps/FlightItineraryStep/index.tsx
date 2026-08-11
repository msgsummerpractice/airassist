import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Typography,
} from "@mui/material";
import AirportSelector from "./AirportSelector";
import FlightTypeToggle from "./FlightTypeToggle";
import ConnectionsPanel from "./ConnectionsPanel";
import { type AirportOption } from "./AirportAutoComplete";

function FlightItineraryStep() {
  const [flightType, setFlightType] = useState<"direct" | "connecting">(
    "direct",
  );
  const [departingAirport, setDepartingAirport] =
    useState<AirportOption | null>(null);
  const [destinationAirport, setDestinationAirport] =
    useState<AirportOption | null>(null);
  const [connections, setConnections] = useState<(AirportOption | null)[]>([
    null,
  ]);
  const [disruptedLeg, setDisruptedLeg] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // errors are derived — they appear after first submit attempt and clear as user fixes each field
  const errors = submitted
    ? {
        departing: !departingAirport
          ? "Departing airport is required"
          : undefined,
        destination: !destinationAirport
          ? "Destination airport is required"
          : undefined,
        connections: connections.map((c) =>
          !c ? "Connection airport is required" : undefined,
        ),
        disruptedLeg:
          flightType === "connecting" && disruptedLeg === null
            ? "Please mark which flight was disrupted"
            : undefined,
      }
    : {
        departing: undefined,
        destination: undefined,
        connections: [],
        disruptedLeg: undefined,
      };

  const isValid =
    !!departingAirport &&
    !!destinationAirport &&
    (flightType === "direct" ||
      (connections.every((c) => c !== null) && disruptedLeg !== null));

  const handleNext = () => {
    setSubmitted(true);
    if (isValid) {
      // advance to next wizard step
    }
  };

  return (
    <Box sx={{ maxWidth: 760, mx: "auto", px: { xs: 2, md: 4 }, py: 3 }}>
      <Card>
        <CardContent sx={{ p: { xs: 2, md: 4 } }}>
          {/* Step title */}
          <Typography variant="h2" sx={{ textAlign: "left", mb: 1 }}>
            Flight Itinerary
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 3, fontSize: "0.875rem", textAlign: "left" }}
          >
            In this step, we record the basic data for a case to determine the
            orthodromic distance between the starting point and final
            destination. This calculation helps determine your level of
            compensation.
          </Typography>

          <AirportSelector
            departing={departingAirport}
            destination={destinationAirport}
            onDepartingChange={setDepartingAirport}
            onDestinationChange={setDestinationAirport}
            errors={errors.departing}
            errorDestination={errors.destination}
          />

          <Divider sx={{ my: 3 }} />

          <FlightTypeToggle value={flightType} onChange={setFlightType} />

          {flightType === "connecting" && (
            <ConnectionsPanel
              connections={connections}
              onChange={setConnections}
              departingAirport={departingAirport?.iata ?? ""}
              destinationAirport={destinationAirport?.iata ?? ""}
              disruptedLeg={disruptedLeg}
              onDisruptedLegChange={setDisruptedLeg}
              connectionErrors={errors.connections}
              disruptedLegError={errors.disruptedLeg}
            />
          )}
        </CardContent>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            px: { xs: 2, md: 4 },
            py: 2,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <Button variant="outlined">Back</Button>
          <Button
            variant="contained"
            onClick={handleNext}
            endIcon={<span>→</span>}
          >
            Next Step
          </Button>
        </Box>
      </Card>
    </Box>
  );
}

export default FlightItineraryStep;
