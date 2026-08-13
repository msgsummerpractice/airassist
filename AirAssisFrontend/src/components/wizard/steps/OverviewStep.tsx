import { useAppSnackbar } from "../../utils/use_app_snackbar";
import {
  ArrowBack,
  DescriptionOutlined,
  FactCheckOutlined,
  FlightOutlined,
  PersonOutlineOutlined,
  ReportProblemOutlined,
  RouteOutlined,
  VerifiedUserOutlined,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import type {
  DisruptionFormData,
  DocumentUploadData,
  GDPRData,
  Itinerary,
  Leg,
  PassengerData,
} from "../types/wizardTypes";
import dayjs from "dayjs";
import { AppSnackbar } from "../../utils/app_snackbar";
import React from "react";

interface OverviewStepProps {
  itinerary: Itinerary;
  legDetails: Leg[];
  disruption: DisruptionFormData;
  passenger: PassengerData;
  documents: DocumentUploadData;
  gdpr: GDPRData;
  onBack?: () => void;
  onEditDisruption?: () => void;
}

type EligibilityStatus = "checking" | "eligible" | "ineligible" | "error";

type EligibilityResponse = {
  success?: boolean;
  is_eligible?: boolean;
  message?: string;
  reason?: string | null;
  errors?: Record<string, unknown>;
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

const disruptionLabels: Record<string, string> = {
  CANCELATION: "Cancellation",
  DELAY: "Delay",
  DENIED_BOARDING: "Denied boarding",
  MORE_THAN_14_DAYS: "More than 14 days before departure",
  LESS_THAN_14_DAYS: "Less than 14 days before departure",
  ON_FLIGHT_DAY: "On flight day",
  LESS_THAN_3_HOURS: "Less than 3 hours",
  MORE_THAN_3_HOURS: "More than 3 hours",
  CONNECTION_FLIGHT_LOST: "Connection flight missed",
  YES: "Yes",
  NO: "No",
};

const formatOption = (value: string) => disruptionLabels[value] ?? value;

const extractErrorMessage = (payload: unknown): string | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const data = payload as {
    message?: unknown;
    errors?: Record<string, unknown>;
  };

  if (typeof data.message === "string" && data.message.trim()) {
    return data.message;
  }

  if (!data.errors || typeof data.errors !== "object") {
    return null;
  }

  for (const [field, raw] of Object.entries(data.errors)) {
    if (Array.isArray(raw) && raw.length > 0) {
      return `${field}: ${String(raw[0])}`;
    }
    if (typeof raw === "string" && raw.trim()) {
      return `${field}: ${raw}`;
    }
  }

  return null;
};

const formatAirport = (airport: Itinerary["departingAirport"]) => {
  if (!airport) {
    return "Not selected";
  }

  return `${airport.iata} - ${airport.name}`;
};

const formatDate = (value: Leg["flightDate"]) => {
  if (!value) {
    return "Not provided";
  }

  return value.format("DD MMM YYYY");
};

const formatTime = (value: Leg["plannedDepartureTime"]) => {
  if (!value) {
    return "Not provided";
  }

  return value.format("HH:mm");
};

const toIsoDateTime = (
  dateValue: Leg["flightDate"],
  timeValue: Leg["plannedDepartureTime"],
  nextDay = false,
) => {
  if (!dateValue || !timeValue) return null;

  let dt = dayjs(dateValue)
    .hour(timeValue.hour())
    .minute(timeValue.minute())
    .second(0)
    .millisecond(0);

  if (nextDay) {
    dt = dt.add(1, "day");
  }

  return dt.toISOString();
};

const SummarySection = ({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) => (
  <Card variant="outlined">
    <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: "rgba(0, 49, 120, 0.08)",
              color: "primary.main",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </Box>
          <Typography variant="h2">{title}</Typography>
        </Stack>
        <Divider />
        {children}
      </Stack>
    </CardContent>
  </Card>
);

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: { xs: "1fr", sm: "180px 1fr" },
      gap: 1,
    }}
  >
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body1">{value}</Typography>
  </Box>
);

function OverviewStep({
  itinerary,
  legDetails,
  disruption,
  passenger,
  documents,
  gdpr,
  onBack,
  onEditDisruption,
}: OverviewStepProps) {
  const [submitting, setSubmitting] = React.useState(false);
  const [eligibilityStatus, setEligibilityStatus] =
    React.useState<EligibilityStatus>("checking");
  const [eligibilityMessage, setEligibilityMessage] = React.useState<string>(
    "Checking case eligibility...",
  );
  const { snackbar, closeSnackbar, showSuccessSnackbar, showErrorSnackbar } =
    useAppSnackbar();

  const buildCaseFormData = React.useCallback(() => {
    const formData = new FormData();
    const disruptedLegIndex = itinerary.disruptedLeg ?? 0;
    const mainLeg = legDetails[0];

    if (!mainLeg) {
      throw new Error("At least one flight leg is required.");
    }

    const isConnectingTrip = legDetails.length > 1;
    const finalLeg = legDetails[legDetails.length - 1] ?? mainLeg;

    const mainDepIso = toIsoDateTime(
      mainLeg.flightDate,
      mainLeg.plannedDepartureTime,
      false,
    );
    const mainArrIso = toIsoDateTime(
      finalLeg.flightDate,
      finalLeg.plannedArrivalTime,
      finalLeg.nextDayArrival,
    );

    if (!mainDepIso || !mainArrIso) {
      throw new Error("Invalid main leg date/time");
    }

    formData.append(
      "flight_date",
      mainLeg.flightDate?.format("YYYY-MM-DD") ?? "",
    );
    formData.append("flight_number", mainLeg.flightNumber);
    formData.append("airline", mainLeg.airline);
    formData.append("reservation_number", mainLeg.reservationNumber);
    formData.append("departing_airport", mainLeg.departureIata);
    formData.append("destination_airport", finalLeg.arrivalIata);
    formData.append("planned_departure_time", mainDepIso);
    formData.append("planned_arrival_time", mainArrIso);
    formData.append("is_problem_flight", String(disruptedLegIndex === 0));
    formData.append("is_main_flight", "true");

    const connectionPayload = (isConnectingTrip ? legDetails : []).map(
      (leg, index) => {
        const depIso = toIsoDateTime(
          leg.flightDate,
          leg.plannedDepartureTime,
          false,
        );
        const arrIso = toIsoDateTime(
          leg.flightDate,
          leg.plannedArrivalTime,
          leg.nextDayArrival,
        );

        return {
          flight_date: leg.flightDate?.format("YYYY-MM-DD") ?? "",
          flight_number: leg.flightNumber,
          airline: leg.airline,
          reservation_number: leg.reservationNumber,
          departing_airport: leg.departureIata,
          destination_airport: leg.arrivalIata,
          planned_departure_time: depIso,
          planned_arrival_time: arrIso,
          is_problem_flight:
            disruptedLegIndex !== 0 && disruptedLegIndex === index,
        };
      },
    );

    formData.append("connection_flights", JSON.stringify(connectionPayload));
    formData.append("disruption", JSON.stringify(disruption));

    formData.append("first_name", passenger.firstName);
    formData.append("last_name", passenger.lastName);
    formData.append("date_of_birth", passenger.dateOfBirth);
    formData.append("email", passenger.email);
    formData.append("phone", passenger.phone);
    formData.append("address", passenger.address);
    formData.append("postal_code", passenger.postalCode);

    if (documents.boardingPass) {
      formData.append("boarding_pass", documents.boardingPass);
    }
    if (documents.identityDocument) {
      formData.append("passport", documents.identityDocument);
    }

    formData.append("gdpr_consent", String(gdpr.gdprConsent));

    return formData;
  }, [itinerary, legDetails, disruption, passenger, documents, gdpr]);

  const readJsonSafe = React.useCallback(async (res: Response) => {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }, []);

  React.useEffect(() => {
    let active = true;

    const runEligibilityCheck = async () => {
      setEligibilityStatus("checking");
      setEligibilityMessage("Checking case eligibility...");

      try {
        const body = buildCaseFormData();
        const res = await fetch(
          `${API_BASE_URL}/api/cases/eligibility-check/`,
          {
            method: "POST",
            body,
          },
        );

        const data = (await readJsonSafe(res)) as EligibilityResponse | null;
        if (!active) {
          return;
        }

        if (!res.ok) {
          setEligibilityStatus("error");
          setEligibilityMessage(
            extractErrorMessage(data) ?? "Could not validate eligibility.",
          );
          return;
        }

        if (data?.is_eligible) {
          setEligibilityStatus("eligible");
          setEligibilityMessage(
            data?.message ?? "Case is eligible for submission.",
          );
          return;
        }

        const reasonSuffix =
          data?.reason && String(data.reason).trim()
            ? ` ${String(data.reason).trim()}`
            : "";

        setEligibilityStatus("ineligible");
        setEligibilityMessage(
          `${data?.message ?? "Case is NOT eligible for submission."}${reasonSuffix}`,
        );
      } catch {
        if (!active) {
          return;
        }
        setEligibilityStatus("error");
        setEligibilityMessage(
          "Could not validate eligibility. Please try again.",
        );
      }
    };

    runEligibilityCheck();

    return () => {
      active = false;
    };
  }, [buildCaseFormData, readJsonSafe]);

  const handleSubmit = async () => {
    if (eligibilityStatus !== "eligible") {
      showErrorSnackbar(
        eligibilityMessage ?? "Case is NOT eligible for submission.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const submitBody = buildCaseFormData();
      const submitRes = await fetch(`${API_BASE_URL}/api/cases/`, {
        method: "POST",
        body: submitBody,
      });

      const submitData = await readJsonSafe(submitRes);

      if (!submitRes.ok) {
        showErrorSnackbar(
          extractErrorMessage(submitData) ?? "Failed to submit case.",
        );
        return;
      }

      showSuccessSnackbar("Case submitted successfully.");
    } catch (error) {
      showErrorSnackbar(
        error instanceof Error
          ? error.message
          : "Unexpected error while submitting.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 920, mx: "auto", px: { xs: 2, md: 4 }, py: 3 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
          <Stack spacing={1.5}>
            <Chip
              label="Final step"
              color="primary"
              variant="outlined"
              sx={{ alignSelf: "flex-start" }}
            />
            <Typography
              variant="h1"
              sx={{ fontSize: { xs: "1.75rem", md: "2.1rem" } }}
            >
              Overview
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Review all claim details before final submission.
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <Stack spacing={2.5}>
        <SummarySection
          icon={<RouteOutlined fontSize="small" />}
          title="Itinerary"
        >
          <Stack spacing={1.5}>
            <DetailRow
              label="Departure"
              value={formatAirport(itinerary.departingAirport)}
            />
            <DetailRow
              label="Destination"
              value={formatAirport(itinerary.destinationAirport)}
            />
            <DetailRow
              label="Flight type"
              value={
                itinerary.flightType === "direct" ? "Direct" : "Connecting"
              }
            />
            {itinerary.flightType === "connecting" ? (
              <DetailRow
                label="Connections"
                value={
                  itinerary.connections.filter(Boolean).length > 0
                    ? itinerary.connections
                        .filter(Boolean)
                        .map((airport) => formatAirport(airport ?? null))
                        .join(" • ")
                    : "None selected"
                }
              />
            ) : null}
            <DetailRow
              label="Disrupted leg"
              value={
                itinerary.disruptedLeg !== null
                  ? `Leg ${itinerary.disruptedLeg + 1}`
                  : "Not selected"
              }
            />
          </Stack>
        </SummarySection>

        <SummarySection
          icon={<FlightOutlined fontSize="small" />}
          title="Flight Details"
        >
          <Stack spacing={2}>
            {legDetails.map((leg, index) => (
              <Box
                key={`${leg.departureIata}-${leg.arrivalIata}-${index}`}
                sx={{
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 2,
                  p: 2,
                  bgcolor: "background.default",
                }}
              >
                <Stack spacing={1.25}>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    Leg {index + 1}: {leg.departureIata} to {leg.arrivalIata}
                  </Typography>
                  <DetailRow
                    label="Route"
                    value={`${leg.departureAirport} -> ${leg.arrivalAirport}`}
                  />
                  <DetailRow
                    label="Flight date"
                    value={formatDate(leg.flightDate)}
                  />
                  <DetailRow
                    label="Flight number"
                    value={leg.flightNumber || "Not provided"}
                  />
                  <DetailRow
                    label="Airline"
                    value={leg.airline || "Not provided"}
                  />
                  <DetailRow
                    label="Reservation number"
                    value={leg.reservationNumber || "Not provided"}
                  />
                  <DetailRow
                    label="Departure time"
                    value={formatTime(leg.plannedDepartureTime)}
                  />
                  <DetailRow
                    label="Arrival time"
                    value={formatTime(leg.plannedArrivalTime)}
                  />
                  <DetailRow
                    label="Next day arrival"
                    value={leg.nextDayArrival ? "Yes" : "No"}
                  />
                </Stack>
              </Box>
            ))}
          </Stack>
        </SummarySection>

        <SummarySection
          icon={<ReportProblemOutlined fontSize="small" />}
          title="Disruption"
        >
          <Stack spacing={1.5}>
            <DetailRow
              label="Disruption type"
              value={formatOption(disruption.motive) || "Not provided"}
            />
            {disruption.cancellation_type ? (
              <DetailRow
                label="Cancellation timing"
                value={formatOption(disruption.cancellation_type)}
              />
            ) : null}
            {disruption.delay_type ? (
              <DetailRow
                label="Delay type"
                value={formatOption(disruption.delay_type)}
              />
            ) : null}
            {disruption.denied_boarding_type ? (
              <DetailRow
                label="Voluntary denied boarding"
                value={formatOption(disruption.denied_boarding_type)}
              />
            ) : null}
            {disruption.denied_boarding_reason ? (
              <DetailRow
                label="Denied boarding reason"
                value={formatOption(disruption.denied_boarding_reason)}
              />
            ) : null}
            {disruption.airline_motive_mentioned ? (
              <DetailRow
                label="Airline mentioned motive"
                value={formatOption(disruption.airline_motive_mentioned)}
              />
            ) : null}
            {disruption.airline_motive ? (
              <DetailRow
                label="Airline motive"
                value={formatOption(disruption.airline_motive)}
              />
            ) : null}
            <DetailRow
              label="Incident description"
              value={
                disruption.incident_description ||
                "No additional description provided"
              }
            />
          </Stack>
        </SummarySection>

        <SummarySection
          icon={<PersonOutlineOutlined fontSize="small" />}
          title="Passenger"
        >
          <Stack spacing={1.5}>
            <DetailRow
              label="First name"
              value={passenger.firstName || "Not provided"}
            />
            <DetailRow
              label="Last name"
              value={passenger.lastName || "Not provided"}
            />
            <DetailRow
              label="Date of birth"
              value={passenger.dateOfBirth || "Not provided"}
            />
            <DetailRow
              label="Email"
              value={passenger.email || "Not provided"}
            />
            <DetailRow
              label="Phone"
              value={passenger.phone || "Not provided"}
            />
            <DetailRow
              label="Address"
              value={passenger.address || "Not provided"}
            />
            <DetailRow
              label="Postal code"
              value={passenger.postalCode || "Not provided"}
            />
          </Stack>
        </SummarySection>

        <SummarySection
          icon={<DescriptionOutlined fontSize="small" />}
          title="Documents"
        >
          <Stack spacing={1.5}>
            <DetailRow
              label="Boarding pass"
              value={documents.boardingPass?.name || "Not uploaded"}
            />
            <DetailRow
              label="Identity document"
              value={documents.identityDocument?.name || "Not uploaded"}
            />
          </Stack>
        </SummarySection>

        <SummarySection
          icon={<VerifiedUserOutlined fontSize="small" />}
          title="Consent"
        >
          <Stack spacing={1.5}>
            <DetailRow
              label="Contact email"
              value={gdpr.email || "Not provided"}
            />
            <DetailRow
              label="GDPR consent"
              value={gdpr.gdprConsent ? "Granted" : "Not granted"}
            />
          </Stack>
        </SummarySection>
      </Stack>

      <Alert
        severity={
          eligibilityStatus === "eligible"
            ? "success"
            : eligibilityStatus === "checking"
              ? "info"
              : "error"
        }
        variant="filled"
        action={
          (eligibilityStatus === "ineligible" ||
            eligibilityStatus === "error") &&
          onEditDisruption ? (
            <Button color="inherit" size="small" onClick={onEditDisruption}>
              Edit Disruption
            </Button>
          ) : undefined
        }
        sx={{
          mt: 3,
          borderRadius: 2,
          alignItems: "center",
          "& .MuiAlert-message": {
            fontWeight: 500,
          },
        }}
      >
        {eligibilityMessage}
      </Alert>

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={onBack}>
          Back
        </Button>
        <Button
          variant="contained"
          endIcon={<FactCheckOutlined />}
          disabled={submitting || eligibilityStatus !== "eligible"}
          onClick={handleSubmit}
        >
          {submitting
            ? "Submitting..."
            : eligibilityStatus === "checking"
              ? "Checking eligibility..."
              : "Submit Claim"}
        </Button>

        <AppSnackbar
          open={snackbar.open}
          message={snackbar.message}
          severity={snackbar.severity}
          onClose={closeSnackbar}
        />
      </Box>
    </Box>
  );
}

export default OverviewStep;
