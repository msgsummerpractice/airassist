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

interface OverviewStepProps {
  itinerary: Itinerary;
  legDetails: Leg[];
  disruption: DisruptionFormData;
  passenger: PassengerData;
  documents: DocumentUploadData;
  gdpr: GDPRData;
  onBack?: () => void;
}

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

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
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
}: OverviewStepProps) {
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
            <Typography variant="h1" sx={{ fontSize: { xs: "1.75rem", md: "2.1rem" } }}>
              Overview
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Review all claim details before the final submission step is wired.
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <Stack spacing={2.5}>
        <SummarySection icon={<RouteOutlined fontSize="small" />} title="Itinerary">
          <Stack spacing={1.5}>
            <DetailRow label="Departure" value={formatAirport(itinerary.departingAirport)} />
            <DetailRow label="Destination" value={formatAirport(itinerary.destinationAirport)} />
            <DetailRow
              label="Flight type"
              value={itinerary.flightType === "direct" ? "Direct" : "Connecting"}
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

        <SummarySection icon={<FlightOutlined fontSize="small" />} title="Flight Details">
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
                  <DetailRow label="Route" value={`${leg.departureAirport} -> ${leg.arrivalAirport}`} />
                  <DetailRow label="Flight date" value={formatDate(leg.flightDate)} />
                  <DetailRow label="Flight number" value={leg.flightNumber || "Not provided"} />
                  <DetailRow label="Airline" value={leg.airline || "Not provided"} />
                  <DetailRow label="Reservation number" value={leg.reservationNumber || "Not provided"} />
                  <DetailRow label="Departure time" value={formatTime(leg.plannedDepartureTime)} />
                  <DetailRow label="Arrival time" value={formatTime(leg.plannedArrivalTime)} />
                  <DetailRow
                    label="Next day arrival"
                    value={leg.nextDayArrival ? "Yes" : "No"}
                  />
                </Stack>
              </Box>
            ))}
          </Stack>
        </SummarySection>

        <SummarySection icon={<ReportProblemOutlined fontSize="small" />} title="Disruption">
          <Stack spacing={1.5}>
            <DetailRow label="Disruption type" value={formatOption(disruption.motive) || "Not provided"} />
            {disruption.cancellation_type ? (
              <DetailRow label="Cancellation timing" value={formatOption(disruption.cancellation_type)} />
            ) : null}
            {disruption.delay_type ? (
              <DetailRow label="Delay type" value={formatOption(disruption.delay_type)} />
            ) : null}
            {disruption.denied_boarding_type ? (
              <DetailRow label="Voluntary denied boarding" value={formatOption(disruption.denied_boarding_type)} />
            ) : null}
            {disruption.denied_boarding_reason ? (
              <DetailRow label="Denied boarding reason" value={formatOption(disruption.denied_boarding_reason)} />
            ) : null}
            {disruption.airline_motive_mentioned ? (
              <DetailRow label="Airline mentioned motive" value={formatOption(disruption.airline_motive_mentioned)} />
            ) : null}
            {disruption.airline_motive ? (
              <DetailRow label="Airline motive" value={formatOption(disruption.airline_motive)} />
            ) : null}
            <DetailRow
              label="Incident description"
              value={disruption.incident_description || "No additional description provided"}
            />
          </Stack>
        </SummarySection>

        <SummarySection icon={<PersonOutlineOutlined fontSize="small" />} title="Passenger">
          <Stack spacing={1.5}>
            <DetailRow label="First name" value={passenger.firstName || "Not provided"} />
            <DetailRow label="Last name" value={passenger.lastName || "Not provided"} />
            <DetailRow label="Date of birth" value={passenger.dateOfBirth || "Not provided"} />
            <DetailRow label="Email" value={passenger.email || "Not provided"} />
            <DetailRow label="Phone" value={passenger.phone || "Not provided"} />
            <DetailRow label="Address" value={passenger.address || "Not provided"} />
            <DetailRow label="Postal code" value={passenger.postalCode || "Not provided"} />
          </Stack>
        </SummarySection>

        <SummarySection icon={<DescriptionOutlined fontSize="small" />} title="Documents">
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

        <SummarySection icon={<VerifiedUserOutlined fontSize="small" />} title="Consent">
          <Stack spacing={1.5}>
            <DetailRow label="Contact email" value={gdpr.email || "Not provided"} />
            <DetailRow
              label="GDPR consent"
              value={gdpr.gdprConsent ? "Granted" : "Not granted"}
            />
          </Stack>
        </SummarySection>
      </Stack>

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={onBack}>
          Back
        </Button>
        <Button variant="contained" endIcon={<FactCheckOutlined />} disabled>
          Submit Claim
        </Button>
      </Box>
    </Box>
  );
}

export default OverviewStep;