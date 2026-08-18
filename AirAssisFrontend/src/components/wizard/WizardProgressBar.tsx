import CheckIcon from "@mui/icons-material/Check";
import FlightIcon from "@mui/icons-material/Flight";
import { Box } from "@mui/material";
import { keyframes } from "@emotion/react";
import { useState } from "react";

interface WizardProgressBarProps {
  steps: string[];
  activeStep: number;
}

const flyAcross = keyframes`
  from {
    left: 0%;
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  80% {
    opacity: 1;
  }
  to {
    left: calc(100% - 22px);
    opacity: 0;
  }
`;

interface WizardStepCircleProps {
  active: boolean;
  completed: boolean;
  value: number;
}

function WizardStepCircle({ active, completed, value }: WizardStepCircleProps) {
  return (
    <Box
      sx={(theme) => ({
        width: 34,
        height: 34,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        fontWeight: 700,
        fontSize: 14,
        transition: "all 180ms ease",
        backgroundColor: completed
          ? theme.palette.secondary.main
          : active
            ? theme.palette.primary.main
            : theme.palette.grey[100],
        color: completed || active ? "#fff" : theme.palette.text.secondary,
        border:
          completed || active ? "none" : `1px solid ${theme.palette.grey[300]}`,
        boxShadow: active ? "0 0 0 3px rgba(0,49,120,0.15)" : "none",
      })}
    >
      {completed ? <CheckIcon sx={{ fontSize: 18 }} /> : value}
    </Box>
  );
}

function WizardProgressBar({ steps, activeStep }: WizardProgressBarProps) {
  const clampedStep = Math.min(Math.max(activeStep, 0), steps.length - 1);

  const [prevStep, setPrevStep] = useState(clampedStep);
  const [isForward, setIsForward] = useState(false);
  if (clampedStep !== prevStep) {
    setIsForward(clampedStep > prevStep);
    setPrevStep(clampedStep);
  }

  return (
    <Box sx={{ maxWidth: 1220, mx: "auto", px: { xs: 2, md: 4 }, pt: 3 }}>
      <Box
        sx={{ display: "flex", alignItems: "center", width: "100%", mb: 1.5 }}
      >
        {steps.map((label, index) => {
          const completed = index < clampedStep;
          const active = index === clampedStep;

          return (
            <Box
              key={label}
              sx={{
                display: "flex",
                alignItems: "center",
                flex: index === steps.length - 1 ? "0 0 auto" : "1 1 0",
                minWidth: 0,
              }}
            >
              <WizardStepCircle
                active={active}
                completed={completed}
                value={index + 1}
              />
              {index < steps.length - 1 && (
                <Box
                  sx={{
                    position: "relative",
                    flex: 1,
                    minWidth: 16,
                    mx: 1.25,
                    height: 22,
                  }}
                >
                  <Box
                    sx={(theme) => ({
                      position: "absolute",
                      top: "50%",
                      left: 0,
                      right: 0,
                      borderTop: `3px dashed ${
                        index < clampedStep
                          ? theme.palette.secondary.main
                          : theme.palette.grey[400]
                      }`,
                      transform: "translateY(-50%)",
                    })}
                  />
                  {index === clampedStep - 1 && isForward && (
                    <FlightIcon
                      key={clampedStep}
                      sx={(theme) => ({
                        position: "absolute",
                        top: "50%",
                        left: 0,
                        fontSize: 20,
                        color: theme.palette.secondary.main,
                        transform: "translateY(-50%) rotate(90deg)",
                        animation: `${flyAcross} 900ms ease-in-out forwards`,
                      })}
                    />
                  )}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export default WizardProgressBar;
