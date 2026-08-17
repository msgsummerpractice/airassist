import {
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Stack,
} from "@mui/material";
import FlightTakeoffOutlined from "@mui/icons-material/FlightTakeoffOutlined";
import HubOutlined from "@mui/icons-material/HubOutlined";

import { SECTION_ICON_COLOR } from "../../constants";
import type { CaseDetails } from "../../types";
import CaseCard from "./CaseCard";
import CaseDetailsTable from "./CaseDetailsTable";

type FlightDetailsCardProps = {
  details: CaseDetails;
  formatDate: (value: string | null | undefined) => string;
};

function FlightDetailsCard({ details, formatDate }: FlightDetailsCardProps) {
  const flight = details.flight;

  return (
    <CaseCard
      icon={<FlightTakeoffOutlined sx={{ color: SECTION_ICON_COLOR }} />}
      title="Flight details"
    >
      {flight ? (
        <CaseDetailsTable
          rows={[
            ["Flight date", formatDate(flight.flight_date)],
            ["Flight Nr.", flight.flight_number],
            ["Airline", flight.airline],
            ["Reservation Number", flight.reservation_number],
            ["Departing Airport", flight.departing_airport],
            ["Destination Airport", flight.destination_airport],
            ["Planned Departure Time", flight.planned_departure_time],
            ["Planned Arrival Time", flight.planned_arrival_time],
          ]}
        />
      ) : (
        <Typography color="text.secondary">
          Main flight details are not available.
        </Typography>
      )}

      <Divider sx={{ my: 2 }} />
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
        <HubOutlined sx={{ color: SECTION_ICON_COLOR }} />
        <Typography variant="h6">Connecting Flights</Typography>
      </Stack>
      {details.connecting_flights.length === 0 ? (
        <Typography color="text.secondary">None</Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Flight Date</TableCell>
                <TableCell>Flight Nr.</TableCell>
                <TableCell>From</TableCell>
                <TableCell>To</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {details.connecting_flights.map((connectingFlight, index) => (
                <TableRow key={`${connectingFlight.flight_number}-${index}`}>
                  <TableCell>
                    {formatDate(connectingFlight.flight_date)}
                  </TableCell>
                  <TableCell>{connectingFlight.flight_number}</TableCell>
                  <TableCell>{connectingFlight.departing_airport}</TableCell>
                  <TableCell>{connectingFlight.destination_airport}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </CaseCard>
  );
}

export default FlightDetailsCard;
