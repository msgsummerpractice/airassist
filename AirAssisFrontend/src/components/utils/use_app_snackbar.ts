import { useState } from "react";
import type { SyntheticEvent } from "react";
import type { AlertColor, SnackbarCloseReason } from "@mui/material";

import type { AppSnackbarState } from "./app_snackbar";

type ShowSnackbarOptions = {
  message: string;
  severity: AlertColor;
};

export function useAppSnackbar() {
  const [snackbar, setSnackbar] = useState<AppSnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = ({ message, severity }: ShowSnackbarOptions) => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const showSuccessSnackbar = (message: string) => {
    showSnackbar({ message, severity: "success" });
  };

  const showErrorSnackbar = (message: string) => {
    showSnackbar({ message, severity: "error" });
  };

  const closeSnackbar = (
    _event?: Event | SyntheticEvent,
    reason?: SnackbarCloseReason,
  ) => {
    if (reason === "clickaway") {
      return;
    }

    setSnackbar((current) => ({
      ...current,
      open: false,
    }));
  };

  return {
    snackbar,
    showSnackbar,
    showSuccessSnackbar,
    showErrorSnackbar,
    closeSnackbar,
  };
}