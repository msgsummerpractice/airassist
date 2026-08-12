import { useState } from "react";
import {
  Box,
  Button,
  Card,
  Divider,
  InputAdornment,
  Link,
  TextField,
  Typography,
} from "@mui/material";
import {
  PersonOutlined,
  CalendarTodayOutlined,
  EmailOutlined,
  PhoneOutlined,
  HomeOutlined,
  MyLocationOutlined,
  AccountCircleOutlined,
  ArrowForward,
} from "@mui/icons-material";
import type { PassengerData, PassengerFieldErrors } from "../types/wizardTypes";
import { validatePassengerField } from "../utils/passengerStepValidation";

interface PassengersStepProps {
  data: PassengerData;
  onChange: (data: PassengerData) => void;
  onBack?: () => void;
  onFinalize?: () => void;
}

function PassangersStep({
  data,
  onChange,
  onBack,
  onFinalize,
}: PassengersStepProps) {
  const [touched, setTouched] = useState<
    Partial<Record<keyof PassengerData, boolean>>
  >({});

  const errors: PassengerFieldErrors = {};
  for (const key of Object.keys(data) as (keyof PassengerData)[]) {
    const error = validatePassengerField(key, data[key]);
    if (error && touched[key]) {
      errors[key] = error;
    }
  }

  const handleChange =
    (field: keyof PassengerData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...data, [field]: e.target.value });
    };

  const handleBlur = (field: keyof PassengerData) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const today = new Date().toISOString().split("T")[0];

  const adornment = (icon: React.ReactNode) => ({
    startAdornment: <InputAdornment position="start">{icon}</InputAdornment>,
  });

  return (
    <Card elevation={1} sx={{ p: 4, maxWidth: 720, mx: "auto" }}>
      <Typography variant="h2" sx={{ mb: 0.5 }}>
        Passenger Details
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        We need this information to create your account and generate your
        representation contract.
      </Typography>

      {/* Existing User box */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          alignItems: "flex-start",
          border: 1,
          borderColor: "divider",
          borderRadius: 2,
          p: 2,
          mb: 4,
        }}
      >
        <AccountCircleOutlined
          sx={{ color: "warning.main", fontSize: 32, mt: 0.25 }}
        />
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            Existing User?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 0.5 }}>
            Log in to autofill your details and speed up the process.
          </Typography>
          <Link
            component="button"
            underline="hover"
            sx={{ fontWeight: 600, color: "primary.main" }}
          >
            Log In Securely
          </Link>
        </Box>
      </Box>

      {/* Personal info */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 2.5,
          mb: 1,
        }}
      >
        <TextField
          label="First Name"
          placeholder="Jane"
          value={data.firstName}
          onChange={handleChange("firstName")}
          onBlur={handleBlur("firstName")}
          error={!!errors.firstName}
          helperText={errors.firstName}
          required
          fullWidth
          slotProps={{ input: adornment(<PersonOutlined fontSize="small" />) }}
        />
        <TextField
          label="Family Name"
          placeholder="Doe"
          value={data.lastName}
          onChange={handleChange("lastName")}
          onBlur={handleBlur("lastName")}
          error={!!errors.lastName}
          helperText={errors.lastName}
          required
          fullWidth
          slotProps={{ input: adornment(<PersonOutlined fontSize="small" />) }}
        />
      </Box>

      <Box sx={{ maxWidth: { md: "calc(50% - 10px)" }, mb: 4 }}>
        <TextField
          label="Date of Birth"
          type="date"
          value={data.dateOfBirth}
          onChange={handleChange("dateOfBirth")}
          onBlur={handleBlur("dateOfBirth")}
          error={!!errors.dateOfBirth}
          helperText={
            errors.dateOfBirth ?? (
              <Typography
                component="span"
                variant="caption"
                color="primary.main"
              >
                Must be 18 or older to sign a contract.
              </Typography>
            )
          }
          required
          fullWidth
          slotProps={{
            inputLabel: { shrink: true },
            input: adornment(<CalendarTodayOutlined fontSize="small" />),
            htmlInput: { max: today },
          }}
        />
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Contact Information */}
      <Typography variant="h2" sx={{ fontSize: "1.125rem", mb: 2.5 }}>
        Contact Information
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 2.5,
        }}
      >
        <TextField
          label="Email Address"
          type="email"
          placeholder="jane.doe@example.com"
          value={data.email}
          onChange={handleChange("email")}
          onBlur={handleBlur("email")}
          error={!!errors.email}
          helperText={errors.email}
          required
          fullWidth
          slotProps={{ input: adornment(<EmailOutlined fontSize="small" />) }}
        />
        <TextField
          label="Phone Number"
          type="tel"
          placeholder="+44 7700 900077"
          value={data.phone}
          onChange={handleChange("phone")}
          onBlur={handleBlur("phone")}
          error={!!errors.phone}
          helperText={errors.phone}
          required
          fullWidth
          slotProps={{ input: adornment(<PhoneOutlined fontSize="small" />) }}
        />

        <Box sx={{ gridColumn: { md: "1 / -1" } }}>
          <TextField
            label="Street Address"
            placeholder="123 Main St, Apt 4B"
            value={data.address}
            onChange={handleChange("address")}
            onBlur={handleBlur("address")}
            error={!!errors.address}
            helperText={errors.address}
            required
            fullWidth
            slotProps={{ input: adornment(<HomeOutlined fontSize="small" />) }}
          />
        </Box>

        <TextField
          label="Postal Code"
          placeholder="SW1A 1AA"
          value={data.postalCode}
          onChange={handleChange("postalCode")}
          onBlur={handleBlur("postalCode")}
          error={!!errors.postalCode}
          helperText={errors.postalCode}
          required
          fullWidth
          slotProps={{
            input: adornment(<MyLocationOutlined fontSize="small" />),
          }}
        />
      </Box>

      {/* Navigation */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
        <Button variant="outlined" onClick={onBack}>
          Back
        </Button>
        <Button
          variant="contained"
          endIcon={<ArrowForward />}
          onClick={onFinalize}
        >
          Finalize Case
        </Button>
      </Box>
    </Card>
  );
}

export default PassangersStep;
