import { Box, Step, StepLabel, Stepper } from "@mui/material";

interface WizardProgressBarProps {
  steps: string[];
  activeStep: number;
}

function WizardProgressBar({ steps, activeStep }: WizardProgressBarProps) {
  return (
    <Box sx={{ maxWidth: 900, mx: "auto", px: { xs: 2, md: 4 }, pt: 4 }}>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}

export default WizardProgressBar;