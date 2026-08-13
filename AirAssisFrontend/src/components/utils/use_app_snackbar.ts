import { useCallback, useState } from "react";
import type { ReactNode, SyntheticEvent } from "react";
import type {
  AlertColor,
  SnackbarCloseReason,
} from "@mui/material";

import type { AppSnackbarState } from "./app_snackbar";

type ShowSnackbarOptions = {
  message: ReactNode;
  severity: AlertColor;
};

export function useAppSnackbar() {
  const [snackbar, setSnackbar] = useState<AppSnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = useCallback(
    ({ message, severity }: ShowSnackbarOptions) => {
      setSnackbar({
        open: true,
        message,
        severity,
      });
    },
    [],
  );

  const showSuccessSnackbar = useCallback(
    (message: ReactNode) => {
      showSnackbar({
        message,
        severity: "success",
      });
    },
    [showSnackbar],
  );

  const showErrorSnackbar = useCallback(
    (message: ReactNode) => {
      showSnackbar({
        message,
        severity: "error",
      });
    },
    [showSnackbar],
  );

  const closeSnackbar = useCallback(
    (
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
    },
    [],
  );

  return {
    snackbar,
    showSnackbar,
    showSuccessSnackbar,
    showErrorSnackbar,
    closeSnackbar,
  };
}