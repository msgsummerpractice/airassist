import { useState } from "react";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

import type { DisruptionFormData } from "../types/wizardTypes";
import {
  isDisruptionStepValid,
  validateDisruptionStep,
} from "../utils/DisruptionValidation";

interface DisruptionStepProps {
  value: DisruptionFormData;
  onChange: (value: DisruptionFormData) => void;
  onBack?: () => void;
  onNext?: () => void;
}

function DisruptionStep({
  value,
  onChange,
  onBack,
  onNext,
}: DisruptionStepProps) {
  const [submitted, setSubmitted] = useState(false);

  function updateField<K extends keyof DisruptionFormData>(
    field: K,
    fieldValue: DisruptionFormData[K],
  ) {
    onChange({
      ...value,
      [field]: fieldValue,
    });
  }

  const errors = submitted ? validateDisruptionStep(value) : {};

  const handleNext = () => {
    setSubmitted(true);

    if (!isDisruptionStepValid(value)) {
      return;
    }

    onNext?.();
  };

  const optionGroupStyles = {
    display: "grid",
    gap: 1,
    "& .MuiToggleButtonGroup-grouped": {
      border: 1,
      borderColor: "divider",
      borderRadius: 1,
      textTransform: "none",
      fontWeight: 600,
      py: 1.5,
      color: "text.primary",
      backgroundColor: "background.paper",
      "&.Mui-selected": {
        borderColor: "primary.main",
        backgroundColor: "rgba(0, 49, 120, 0.08)",
        color: "primary.main",
      },
      "&.Mui-selected:hover": {
        backgroundColor: "rgba(0, 49, 120, 0.12)",
      },
    },
  };

  const renderDelayTypeSelector = () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography variant="caption" color="text.primary">
        How late arrived to final destination?
      </Typography>

      <ToggleButtonGroup
        exclusive
        fullWidth
        value={value.delay_type}
        onChange={(_, selectedValue) => {
          if (selectedValue) {
            updateField("delay_type", selectedValue);
          }
        }}
        sx={{
          ...optionGroupStyles,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
        }}
      >
        <ToggleButton value="LESS_THAN_3_HOURS">Less than 3h</ToggleButton>
        <ToggleButton value="MORE_THAN_3_HOURS">More than 3h</ToggleButton>
        <ToggleButton value="CONNECTION_FLIGHT_LOST">
          Connection flight lost
        </ToggleButton>
      </ToggleButtonGroup>

      {errors.delay_type && (
        <Typography variant="caption" color="error">
          {errors.delay_type}
        </Typography>
      )}
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 760, mx: "auto", px: { xs: 2, md: 4 }, py: 3 }}>
      <Card>
        <CardContent sx={{ p: { xs: 2, md: 4 } }}>
          <Box sx={{ textAlign: "left", mb: 3 }}>
            <Typography variant="h2" sx={{ mb: 1 }}>
              Disruption details
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: "0.875rem" }}
            >
              Tell us what happened with the flight.
            </Typography>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography variant="caption" color="text.primary">
              What type of disruption?
            </Typography>

            <FormControl fullWidth required error={Boolean(errors.motive)}>
              <InputLabel id="disruption-motive-label">
                Select disruption type
              </InputLabel>

              <Select
                labelId="disruption-motive-label"
                label="Select disruption type"
                value={value.motive}
                onChange={(event) => {
                  const motive = event.target
                    .value as DisruptionFormData["motive"];

                  const defaultDelayType =
                    motive === "CANCELATION" || motive === "DENIED_BOARDING"
                      ? "CONNECTION_FLIGHT_LOST"
                      : "";

                  onChange({
                    ...value,
                    motive,
                    cancellation_type: "",
                    delay_type: defaultDelayType,
                    denied_boarding_type: "",
                    denied_boarding_reason: "",
                  });
                }}
              >
                <MenuItem value="CANCELATION">Cancellation</MenuItem>
                <MenuItem value="DELAY">Delay</MenuItem>
                <MenuItem value="DENIED_BOARDING">Denied boarding</MenuItem>
              </Select>

              {errors.motive && (
                <FormHelperText>{errors.motive}</FormHelperText>
              )}
            </FormControl>
          </Box>

          {value.motive && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                p: 2,
                mt: 3,
                border: 1,
                borderColor: "divider",
                borderRadius: 2,
                bgcolor: "background.default",
              }}
            >
              {value.motive === "CANCELATION" && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Typography variant="caption" color="text.primary">
                    How many days before cancellation has the airline informed?
                  </Typography>

                  <ToggleButtonGroup
                    exclusive
                    fullWidth
                    value={value.cancellation_type}
                    onChange={(_, selectedValue) => {
                      if (selectedValue) {
                        updateField("cancellation_type", selectedValue);
                      }
                    }}
                    sx={{
                      ...optionGroupStyles,
                      gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                    }}
                  >
                    <ToggleButton value="MORE_THAN_14_DAYS">
                      &gt; 14 days
                    </ToggleButton>
                    <ToggleButton value="LESS_THAN_14_DAYS">
                      &lt; 14 days
                    </ToggleButton>
                    <ToggleButton value="ON_FLIGHT_DAY">
                      On flight day
                    </ToggleButton>
                  </ToggleButtonGroup>

                  {errors.cancellation_type && (
                    <Typography variant="caption" color="error">
                      {errors.cancellation_type}
                    </Typography>
                  )}

                  {renderDelayTypeSelector()}
                </Box>
              )}

              {value.motive === "DELAY" && renderDelayTypeSelector()}

              {value.motive === "DENIED_BOARDING" && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    <Typography variant="caption" color="text.primary">
                      Did you give up your seat voluntarily?
                    </Typography>

                    <ToggleButtonGroup
                      exclusive
                      fullWidth
                      value={value.denied_boarding_type}
                      onChange={(_, selectedValue) => {
                        if (selectedValue) {
                          onChange({
                            ...value,
                            denied_boarding_type: selectedValue,
                            denied_boarding_reason: "",
                          });
                        }
                      }}
                      sx={{
                        ...optionGroupStyles,
                        gridTemplateColumns: {
                          xs: "1fr",
                          sm: "repeat(2, 1fr)",
                        },
                      }}
                    >
                      <ToggleButton value="YES">Yes</ToggleButton>
                      <ToggleButton value="NO">No</ToggleButton>
                    </ToggleButtonGroup>

                    {errors.denied_boarding_type && (
                      <Typography variant="caption" color="error">
                        {errors.denied_boarding_type}
                      </Typography>
                    )}
                  </Box>

                  {renderDelayTypeSelector()}

                  {value.denied_boarding_type === "NO" && (
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                    >
                      <Typography variant="caption" color="text.primary">
                        Reason behind denial of boarding
                      </Typography>

                      <ToggleButtonGroup
                        exclusive
                        fullWidth
                        value={value.denied_boarding_reason}
                        onChange={(_, selectedValue) => {
                          if (selectedValue) {
                            updateField(
                              "denied_boarding_reason",
                              selectedValue,
                            );
                          }
                        }}
                        sx={{
                          ...optionGroupStyles,
                          gridTemplateColumns: {
                            xs: "1fr",
                            sm: "repeat(2, 1fr)",
                          },
                        }}
                      >
                        <ToggleButton value="FLIGHT_OVERBOOKED">
                          Flight overbooked
                        </ToggleButton>
                        <ToggleButton value="AGGRESSIVE_BEHAVIOR">
                          Aggressive behavior with staff
                        </ToggleButton>
                        <ToggleButton value="INTOXICATION">
                          Intoxication
                        </ToggleButton>
                        <ToggleButton value="UNSPECIFIED_REASON">
                          Unspecified reason
                        </ToggleButton>
                      </ToggleButtonGroup>

                      {errors.denied_boarding_reason && (
                        <Typography variant="caption" color="error">
                          {errors.denied_boarding_reason}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              )}

              <Box
                sx={{
                  display: "flex",
                  gap: 1.5,
                  alignItems: "flex-start",
                  p: 2,
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1,
                  bgcolor: "rgba(255, 255, 255, 0.65)",
                }}
              >
                <InfoOutlinedIcon color="primary" fontSize="small" />

                <Typography variant="caption" color="text.secondary">
                  Selecting options will help evaluate your basic eligibility
                  for compensation under EU Regulation 261/2004.
                </Typography>
              </Box>
            </Box>
          )}

          {value.motive && (
            <>
              <Divider sx={{ my: 3 }} />

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography variant="caption" color="text.primary">
                  Additional information
                </Typography>

                <TextField
                  label="Describe what happened"
                  value={value.incident_description}
                  onChange={(event) =>
                    updateField("incident_description", event.target.value)
                  }
                  multiline
                  minRows={5}
                  fullWidth
                  error={Boolean(errors.incident_description)}
                  slotProps={{ htmlInput: { maxLength: 2000 } }}
                  helperText={
                    errors.incident_description ??
                    `${value.incident_description.length}/2000 characters`
                  }
                />
              </Box>
            </>
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

export default DisruptionStep;
