import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  FormHelperText,
  InputAdornment,
  Link,
  TextField,
  Typography,
} from "@mui/material";
import { EmailOutlined, ShieldOutlined, ArrowBack } from "@mui/icons-material";
import type { GDPRData } from "../types/wizardTypes";
import { validateGDPREmail } from "../utils/gdprStepValidation";

interface GDPRStepProps {
  data: GDPRData;
  onChange: (data: GDPRData) => void;
  onBack?: () => void;
  onNext?: () => void;
}

function GDPRStep({ data, onChange, onBack, onNext }: GDPRStepProps) {
  const [emailTouched, setEmailTouched] = useState(false);
  const [consentTouched, setConsentTouched] = useState(false);

  const emailError = emailTouched ? validateGDPREmail(data.email) : "";
  const consentError =
    consentTouched && !data.gdprConsent ? "You must consent to continue" : "";

  return (
    <Box sx={{ maxWidth: 760, mx: "auto", px: { xs: 2, md: 4 }, py: 3 }}>
      <Card>
        <CardContent sx={{ p: { xs: 2, md: 4 } }}>
          <Box sx={{ textAlign: "left", mb: 3 }}>
            <Typography variant="h2" sx={{ mb: 1 }}>
              Where should we send updates?
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: "0.875rem" }}
            >
              We need your email address to send you the official claim
              documents and updates on your compensation status.
            </Typography>
          </Box>

          <TextField
            label="Email Address"
            type="email"
            placeholder="e.g. name@example.com"
            value={data.email}
            onChange={(e) => onChange({ ...data, email: e.target.value })}
            onBlur={() => setEmailTouched(true)}
            error={!!emailError}
            helperText={emailError}
            required
            fullWidth
            sx={{ mb: 3 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlined fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />

          <Box
            sx={{
              border: 1,
              borderColor: "divider",
              borderRadius: 2,
              p: 2.5,
              mb: 3,
              bgcolor: "background.default",
            }}
          >
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
              <ShieldOutlined
                sx={{ color: "text.secondary", fontSize: 24, mt: 0.25 }}
              />
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                  GDPR Compliance &amp; Privacy
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Your data privacy is our priority. We only collect information
                  strictly necessary to process your EU 261/2004 flight
                  compensation claim. We will never sell your data to third
                  parties. For full details on how we handle your information
                  securely, please review our{" "}
                  <Link
                    href="#"
                    underline="hover"
                    sx={{ fontWeight: 600, color: "primary.main" }}
                  >
                    Privacy Policy
                  </Link>
                  .
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ textAlign: "left" }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={data.gdprConsent}
                  onChange={(e) =>
                    onChange({ ...data, gdprConsent: e.target.checked })
                  }
                  onBlur={() => setConsentTouched(true)}
                />
              }
              label={
                <Typography variant="body1">
                  I explicitly consent to the processing of my personal data
                  (including email) for the purpose of claiming flight
                  compensation, in accordance with the Privacy Policy.{" "}
                  <Typography component="span" color="error">
                    *
                  </Typography>
                </Typography>
              }
              sx={{
                alignItems: "flex-start",
                mr: 0,
                ml: 0,
                "& .MuiFormControlLabel-label": {
                  textAlign: "left",
                },
              }}
            />
            {consentError && (
              <FormHelperText error sx={{ ml: 4 }}>
                {consentError}
              </FormHelperText>
            )}
          </Box>
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
          <Button variant="outlined" startIcon={<ArrowBack />} onClick={onBack}>
            Back
          </Button>
          <Button
            variant="contained"
            endIcon={<span>→</span>}
            onClick={() => {
              setEmailTouched(true);
              setConsentTouched(true);
              if (!validateGDPREmail(data.email) && data.gdprConsent) {
                onNext?.();
              }
            }}
          >
            Next
          </Button>
        </Box>
      </Card>
    </Box>
  );
}

export default GDPRStep;
