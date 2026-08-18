import {
  Box,
  Card,
  CardContent,
  Checkbox,
  Divider,
  FormControlLabel,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import {
  DatePicker,
  LocalizationProvider,
  TimePicker,
} from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import type { Leg } from "../../types/wizardTypes";

interface LegDetailsProps {
  leg: Leg;
  index: number;
  showNextDayOption: boolean;
  timeError?: string;
  onChange: (updated: Leg) => void;
  showErrors: boolean;
}

function LegDetails({
  leg,
  index,
  showNextDayOption,
  timeError,
  onChange,
  showErrors,
}: LegDetailsProps) {
  const set = (field: keyof Leg) => (value: string | Dayjs | null) =>
    onChange({ ...leg, [field]: value });

  const e = showErrors
    ? {
        flightDate: !leg.flightDate ? "Required" : undefined,
        flightNumber: !leg.flightNumber ? "Required" : undefined,
        airline: !leg.airline ? "Required" : undefined,
        reservationNumber: !leg.reservationNumber ? "Required" : undefined,
        plannedDepartureTime: !leg.plannedDepartureTime
          ? "Required"
          : undefined,
        plannedArrivalTime: !leg.plannedArrivalTime
          ? "Required"
          : timeError,
      }
    : {};
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Card
        variant="outlined"
        sx={{ mb: 3, borderRadius: 2, bgcolor: "#f5f7fb" }}
      >
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          {/* Header */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1.5 }}>
            <Box sx={{ textAlign: "center", minWidth: 56 }}>
              <Typography
                variant="h6"
                color="primary"
                sx={{ fontWeight: 700, lineHeight: 1 }}
              >
                {leg.departureIata}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {leg.departureAirport}
              </Typography>
            </Box>

            <Box
              sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1 }}
            >
              <Divider sx={{ flex: 1 }} />
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <FlightTakeoffIcon color="primary" fontSize="small" />
                <Typography variant="caption" color="text.secondary">
                  Leg {index + 1}
                </Typography>
              </Box>
              <Divider sx={{ flex: 1 }} />
            </Box>

            <Box sx={{ textAlign: "center", minWidth: 56 }}>
              <Typography
                variant="h6"
                color="primary"
                sx={{ fontWeight: 700, lineHeight: 1 }}
              >
                {leg.arrivalIata}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {leg.arrivalAirport}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Fields */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DatePicker
                label="Flight Date"
                value={leg.flightDate}
                maxDate={dayjs()}
                onChange={set("flightDate")}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!e.flightDate,
                    helperText: e.flightDate,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Flight Number"
                fullWidth
                placeholder="e.g., BA123"
                value={leg.flightNumber}
                onChange={(e) => set("flightNumber")(e.target.value)}
                error={!!e.flightNumber}
                helperText={e.flightNumber}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Airline"
                fullWidth
                placeholder="e.g., British Airways"
                value={leg.airline}
                onChange={(e) => set("airline")(e.target.value)}
                error={!!e.airline}
                helperText={e.airline}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Reservation Number (PNR)"
                fullWidth
                placeholder="e.g., A1B2C3"
                value={leg.reservationNumber}
                onChange={(e) => set("reservationNumber")(e.target.value)}
                error={!!e.reservationNumber}
                helperText={e.reservationNumber}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TimePicker
                label="Planned Departure Time"
                value={leg.plannedDepartureTime}
                ampm={false}
                format="HH:mm"
                onChange={set("plannedDepartureTime")}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!e.plannedDepartureTime,
                    helperText: e.plannedDepartureTime,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TimePicker
                label="Planned Arrival Time"
                value={leg.plannedArrivalTime}
                ampm={false}
                format="HH:mm"
                onChange={set("plannedArrivalTime")}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!e.plannedArrivalTime,
                    helperText: e.plannedArrivalTime,
                  },
                }}
              />
            </Grid>
            {showNextDayOption && (
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={leg.nextDayArrival}
                      onChange={(e) =>
                        set("nextDayArrival")(e.target.checked as never)
                      }
                      size="small"
                    />
                  }
                  label="The flight lands the next day"
                />
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
    </LocalizationProvider>
  );
}

export default LegDetails;
