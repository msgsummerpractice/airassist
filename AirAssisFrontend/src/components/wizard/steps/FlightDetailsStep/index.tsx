import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
} from "@mui/material";
import type { Leg } from "../../types/wizardTypes";
import LegDetails from "./LegDetails";
import { useState } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

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

  const getAirportDateTime = (
    flightDate: Leg["flightDate"],
    flightTime: Leg["plannedDepartureTime"],
    airportTimezone: string,
    nextDay = false,
  ) => {
    if (!flightDate || !flightTime || !airportTimezone) {
      return null;
    }

    const dateTime = `${flightDate.format("YYYY-MM-DD")}T${flightTime.format(
      "HH:mm:ss",
    )}`;

    const zonedDateTime = dayjs.tz(dateTime, airportTimezone);
    return nextDay ? zonedDateTime.add(1, "day") : zonedDateTime;
  };

  const getLegTimeError = (leg: Leg, nextDayArrival = leg.nextDayArrival) => {
    const departure = getAirportDateTime(
      leg.flightDate,
      leg.plannedDepartureTime,
      leg.departureTimezone,
    );
    const arrival = getAirportDateTime(
      leg.flightDate,
      leg.plannedArrivalTime,
      leg.arrivalTimezone,
      nextDayArrival,
    );

    if (!departure || !arrival) {
      return undefined;
    }

    return arrival.isAfter(departure)
      ? undefined
      : "Arrival date and time must be after departure date and time.";
  };

  const getConnectionTimeError = (previousLeg: Leg | undefined, leg: Leg) => {
    if (!previousLeg) {
      return undefined;
    }

    const previousArrival = getAirportDateTime(
      previousLeg.flightDate,
      previousLeg.plannedArrivalTime,
      previousLeg.arrivalTimezone,
      previousLeg.nextDayArrival,
    );
    const departure = getAirportDateTime(
      leg.flightDate,
      leg.plannedDepartureTime,
      leg.departureTimezone,
    );

    if (!previousArrival || !departure) {
      return undefined;
    }

    return departure.isAfter(previousArrival)
      ? undefined
      : "Departure date and time must be after previous leg arrival date and time.";
  };

  const isLegValid = (leg: Leg, index: number) =>
    !!leg.flightDate &&
    !!leg.departureTimezone &&
    !!leg.arrivalTimezone &&
    !!leg.flightNumber &&
    !!leg.airline &&
    !!leg.reservationNumber &&
    !!leg.plannedDepartureTime &&
    !!leg.plannedArrivalTime &&
    !getLegTimeError(leg) &&
    !getConnectionTimeError(legs[index - 1], leg);

  const handleNext = () => {
    setSubmitted(true);
    if (legs.every(isLegValid)) onNext();
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
          {legs.map((leg, i) => {
            const timeError = getLegTimeError(leg);
            const departureTimeError = getConnectionTimeError(legs[i - 1], leg);

            return (
              <LegDetails
                key={i}
                leg={leg}
                index={i}
                showNextDayOption={!!getLegTimeError(leg, false)}
                timeError={timeError}
                departureTimeError={departureTimeError}
              onChange={(updated) =>
                onLegsChange(
                  legs.map((leg, index) => (index === i ? updated : leg)),
                )
              }
              showErrors={submitted}
              />
            );
          })}
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
