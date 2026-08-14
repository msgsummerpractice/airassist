import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  FormHelperText,
  Link,
  Typography,
} from "@mui/material";
import { ShieldOutlined, ArrowBack } from "@mui/icons-material";
import type { GDPRData } from "../types/wizardTypes";

interface GDPRStepProps {
  data: GDPRData;
  onChange: (data: GDPRData) => void;
  onBack?: () => void;
  onNext?: () => void;
}

function GDPRStep({ data, onChange, onBack, onNext }: GDPRStepProps) {
  const [consentTouched, setConsentTouched] = useState(false);

  const consentError =
    consentTouched && !data.gdprConsent ? "You must consent to continue" : "";

  return (
    <Box sx={{ maxWidth: 1220, mx: "auto", px: { xs: 2, md: 4 }, py: 3 }}>
      <Card>
        <CardContent sx={{ p: { xs: 2, md: 4 } }}>
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
                  for the purpose of claiming flight compensation, in
                  accordance with the Privacy Policy.{" "}
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
              setConsentTouched(true);
              if (data.gdprConsent) {
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
