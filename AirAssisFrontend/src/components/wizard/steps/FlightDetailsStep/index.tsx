import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import type { Leg } from "../../types/wizardTypes";
import LegDetails from "./LegDetails";
import { useState } from "react";

interface FlightDetailsStepProps {
  legs: Leg[];
  onLegsChange: (legs: Leg[]) => void;
  onNext: () => void;
  onBack: () => void;
}

function FlightDetailsStep({
  legs,
  onLegsChange,
  onNext,
  onBack,
}: FlightDetailsStepProps) {
  const [submitted, setSubmitted] = useState(false);

  const getDepartureDateTime = (leg: Leg) => {
    if (!leg.flightDate || !leg.plannedDepartureTime) {
      return null;
    }

    return dayjs(leg.flightDate)
      .hour(leg.plannedDepartureTime.hour())
      .minute(leg.plannedDepartureTime.minute())
      .second(0)
      .millisecond(0);
  };

  const getArrivalDateTime = (leg: Leg) => {
    if (!leg.flightDate || !leg.plannedArrivalTime) {
      return null;
    }

    let value = dayjs(leg.flightDate)
      .hour(leg.plannedArrivalTime.hour())
      .minute(leg.plannedArrivalTime.minute())
      .second(0)
      .millisecond(0);

    const departure = getDepartureDateTime(leg);
    const arrivesNextDay =
      leg.nextDayArrival || (!!departure && value.isBefore(departure));

    if (arrivesNextDay) {
      value = value.add(1, "day");
    }

    return value;
  };

  const isLegValid = (leg: Leg) =>
    !!leg.flightDate &&
    !!leg.flightNumber &&
    !!leg.airline &&
    !!leg.reservationNumber &&
    !!leg.plannedDepartureTime &&
    !!leg.plannedArrivalTime;

  const hasValidConnectionSequence = legs.every((leg, index) => {
    if (index === 0) {
      return true;
    }

    const previousLeg = legs[index - 1];
    const previousArrival = getArrivalDateTime(previousLeg);
    const currentDeparture = getDepartureDateTime(leg);

    if (!previousArrival || !currentDeparture) {
      return true;
    }

    return currentDeparture.isAfter(previousArrival);
  });

  const handleNext = () => {
    setSubmitted(true);
    if (legs.every(isLegValid) && hasValidConnectionSequence) onNext();
  };
  return (
    <Box sx={{ maxWidth: 1220, mx: "auto", px: { xs: 2, md: 4 }, py: 3 }}>
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
          {submitted && !hasValidConnectionSequence && (
            <Alert severity="error" sx={{ mb: 3 }}>
              Each connecting leg must depart after the previous leg arrives.
            </Alert>
          )}
          {legs.map((leg, i) => (
            <LegDetails
              key={i}
              leg={leg}
              index={i}
              onChange={(updated) =>
                onLegsChange(
                  legs.map((leg, index) => (index === i ? updated : leg)),
                )
              }
              showErrors={submitted}
            />
          ))}
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
          <Button variant="outlined" onClick={onBack}>
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            endIcon={<span>→</span>}
          >
            Next
          </Button>
        </Box>
      </Card>
    </Box>
  );
}
export default FlightDetailsStep;
