import { useEffect, useState } from "react";
import axios from "axios";
import {
  Alert,
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
import {
  EU261_FIRST_THRESHOLD,
  EU261_SECOND_THRESHOLD,
  EU261_SHORT_COMPENSATION,
  EU261_MEDIUM_COMPENSATION,
  EU261_LONG_COMPENSATION,
} from "../../../../constants/eu261";
import type { Itinerary } from "../../types/wizardTypes";

type DistanceApiResponse =
  | number
  | {
      distance_km?: number | string;
      distance?: number | string;
      kilometers?: number | string;
      compensation_amount?: number | string;
      compensation?: number | string;
      amount?: number | string;
      data?: {
        distance_km?: number | string;
        compensation_amount?: number | string;
      };
    };

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = Number(value);
    return Number.isFinite(normalized) ? normalized : null;
  }

  return null;
}

// Mirrors EU261 thresholds from case/constants.py
function compensationFromDistance(km: number): number {
  if (km <= EU261_FIRST_THRESHOLD) return EU261_SHORT_COMPENSATION;
  if (km <= EU261_SECOND_THRESHOLD) return EU261_MEDIUM_COMPENSATION;
  return EU261_LONG_COMPENSATION;
}

function readCalculationFromResponse(response: DistanceApiResponse): {
  distanceKm: number | null;
  compensationAmount: number | null;
} {
  if (typeof response === "number") {
    const km = toNumber(response);
    return {
      distanceKm: km,
      compensationAmount: km !== null ? compensationFromDistance(km) : null,
    };
  }

  const distanceKm =
    toNumber(response.distance_km) ??
    toNumber(response.distance) ??
    toNumber(response.kilometers) ??
    toNumber(response.data?.distance_km);

  const compensationAmount =
    toNumber(response.compensation_amount) ??
    toNumber(response.compensation) ??
    toNumber(response.amount) ??
    toNumber(response.data?.compensation_amount) ??
    (distanceKm !== null ? compensationFromDistance(distanceKm) : null);

  return { distanceKm, compensationAmount };
}

interface FlightItineraryStepProps {
  onNext: (confirmed: Itinerary) => void;
}

function FlightItineraryStep({ onNext }: FlightItineraryStepProps) {
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
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [compensationAmount, setCompensationAmount] = useState<number | null>(
    null,
  );
  const [calculationLoading, setCalculationLoading] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  const departingIata = departingAirport?.iata ?? "";
  const destinationIata = destinationAirport?.iata ?? "";

  // Reset results whenever either airport is cleared
  const bothSelected = !!departingIata && !!destinationIata;
  const displayDistance = bothSelected ? distanceKm : null;
  const displayCompensation = bothSelected ? compensationAmount : null;

  useEffect(() => {
    if (!departingIata || !destinationIata) {
      return;
    }

    let isActive = true;

    const runCalculation = async () => {
      try {
        setCalculationLoading(true);
        setCalculationError(null);

        const response = await axios.post<DistanceApiResponse>(
          "/api/airports/distance/",
          {
            from: departingIata,
            to: destinationIata,
          },
        );

        if (!isActive) {
          return;
        }

        const parsed = readCalculationFromResponse(response.data);

        if (parsed.distanceKm === null) {
          setDistanceKm(null);
          setCompensationAmount(null);
          setCalculationError(
            "Distance service returned an unexpected response format.",
          );
          return;
        }

        setDistanceKm(parsed.distanceKm);
        setCompensationAmount(parsed.compensationAmount);
      } catch {
        if (!isActive) {
          return;
        }
        setDistanceKm(null);
        setCompensationAmount(null);
        setCalculationError(
          "Could not calculate distance and compensation. Please verify airport selection.",
        );
      } finally {
        if (isActive) {
          setCalculationLoading(false);
        }
      }
    };

    runCalculation();

    return () => {
      isActive = false;
    };
  }, [departingIata, destinationIata]);

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

  const handleNext = () => {
    setSubmitted(true);
    if (
      !departingAirport ||
      !destinationAirport ||
      (flightType === "connecting" &&
        (!connections.every((c) => c !== null) || disruptedLeg === null))
    ) {
      return;
    }
    const confirmed: Itinerary = {
      departingAirport,
      destinationAirport,
      flightType,
      connections,
      disruptedLeg,
    };
    onNext(confirmed);
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

          <Box
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              p: 2.5,
              mb: 2,
              bgcolor: "background.default",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                display: "block",
                mb: 1.5,
                color: "text.secondary",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                textAlign: "center",
              }}
            >
              Distance &amp; Compensation
            </Typography>

            <Box
              sx={{
                display: "flex",
                gap: 5,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Distance
                </Typography>
                <Typography
                  variant="h2"
                  sx={{
                    color: calculationLoading
                      ? "text.disabled"
                      : "primary.main",
                    mt: 0.25,
                  }}
                >
                  {calculationLoading
                    ? "…"
                    : displayDistance !== null
                      ? `${displayDistance.toFixed(2)} km`
                      : "—"}
                </Typography>
              </Box>

              <Box
                sx={{
                  borderLeft: "1px solid",
                  borderColor: "divider",
                  pl: 5,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Compensation Amount
                </Typography>
                <Typography
                  variant="h2"
                  sx={{
                    color: calculationLoading
                      ? "text.disabled"
                      : "secondary.main",
                    mt: 0.25,
                  }}
                >
                  {calculationLoading
                    ? "…"
                    : displayCompensation !== null
                      ? `€ ${displayCompensation}`
                      : "—"}
                </Typography>
              </Box>
            </Box>

            {calculationError && (
              <Alert severity="error" sx={{ mt: 1.5 }}>
                {calculationError}
              </Alert>
            )}
          </Box>

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
