import type { SyntheticEvent, ReactNode } from "react";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import Slide from "@mui/material/Slide";
import type {
  AlertColor,
  SlideProps,
  SnackbarCloseReason,
} from "@mui/material";
import { AUTO_HIDE_DURATION_MS } from "../../constants/eu261";

type AppSnackbarState = {
  open: boolean;
  message: ReactNode;
  severity: AlertColor;
};

type AppSnackbarProps = {
  open: boolean;
  message: ReactNode;
  severity: AlertColor;
  autoHideDuration?: number;
  onClose: (
    event?: Event | SyntheticEvent,
    reason?: SnackbarCloseReason,
  ) => void;
};

function SlideDownTransition(props: SlideProps) {
  return <Slide {...props} direction="down" />;
}

export function AppSnackbar({
  open,
  message,
  severity,
  autoHideDuration = AUTO_HIDE_DURATION_MS,
  onClose,
}: AppSnackbarProps) {
  return (
    <Snackbar
      open={open}
      onClose={onClose}
      autoHideDuration={autoHideDuration}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      slots={{ transition: SlideDownTransition }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        sx={{ width: "100%" }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}

type SnackbarProviderProps = {
  snackbar: AppSnackbarState;
  onClose: AppSnackbarProps["onClose"];
  children?: ReactNode;
};

export function AppSnackbarContainer({
  snackbar,
  onClose,
  children,
}: SnackbarProviderProps) {
  return (
    <>
      {children}
      <AppSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={onClose}
      />
    </>
  );
}

export type { AppSnackbarState };
