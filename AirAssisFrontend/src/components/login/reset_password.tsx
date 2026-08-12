import { useState } from "react";
import type { FormEvent } from "react";
import "./reset_password.css";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { AppSnackbar } from "../utils/app_snackbar";
import { useAppSnackbar } from "../utils/use_app_snackbar";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

type ResetPasswordProps = {
  onPasswordResetSuccess?: () => void;
  onBackToLogin?: () => void;
};

const readJsonSafely = async <T,>(response: Response): Promise<T | null> => {
  const responseText = await response.text();

  if (!responseText) {
    return null;
  }

  try {
    return JSON.parse(responseText) as T;
  } catch {
    return null;
  }
};

const getPasswordStrength = (value: string) => {
  if (!value) {
    return {
      label: "",
      score: 0,
      color: "#c3c6d4",
    };
  }

  let score = 0;

  if (value.length >= 8) score += 1;
  if (/[A-Z]/.test(value) || /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  if (value.length >= 12) score += 1;

  if (score <= 2) {
    return {
      label: "Weak",
      score: 25,
      color: "#ba1a1a",
    };
  }

  if (score === 3) {
    return {
      label: "Medium",
      score: 50,
      color: "#c77700",
    };
  }

  if (score === 4) {
    return {
      label: "Strong",
      score: 75,
      color: "#1b6d24",
    };
  }

  return {
    label: "Very strong",
    score: 100,
    color: "#003178",
  };
};

const ResetPassword = ({
  onPasswordResetSuccess,
  onBackToLogin,
}: ResetPasswordProps) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    snackbar,
    closeSnackbar,
    showErrorSnackbar,
    showSuccessSnackbar,
  } = useAppSnackbar();

  const passwordMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;

  const passwordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;

  const passwordStrength = getPasswordStrength(newPassword);

  const handleResetSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (passwordMismatch) {
      showErrorSnackbar("The new passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      showErrorSnackbar("The new password must be at least 8 characters long.");
      return;
    }

    closeSnackbar();
    setIsSubmitting(true);

    try {
      const currentAccessToken = localStorage.getItem("airassist_access_token");

      if (!currentAccessToken) {
        throw new Error(
          "No access token found. The password change endpoint requires authentication.",
        );
      }

      const response = await fetch(`${API_BASE_URL}/user/change-password/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentAccessToken}`,
        },
        body: JSON.stringify({
          new_password: newPassword,
        }),
      });

      const data = await readJsonSafely<{
        message?: string;
        error?: string;
      }>(response);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Password change failed. Please try again.",
        );
      }

      showSuccessSnackbar(data?.message || "Password changed successfully.");

      onPasswordResetSuccess?.();
    } catch (error) {
      if (error instanceof Error) {
        showErrorSnackbar(error.message);
      } else {
        showErrorSnackbar("Password change failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box className="reset-password-page">
      <AppSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />

      <Card elevation={3} className="reset-password-card">
        <CardContent className="reset-password-card-content">
          <Stack spacing={1.5} className="reset-password-header">
            <Typography variant="caption" color="secondary.main">
              AIRASSIST PORTAL
            </Typography>
          </Stack>

          <Box component="form" onSubmit={handleResetSubmit} noValidate>
            <Stack spacing={2.5}>
              {/* New Password */}
              <TextField
                label="New password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                fullWidth
                required
                autoComplete="new-password"
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() =>
                            setShowNewPassword((previous) => !previous)
                          }
                          edge="end"
                          aria-label={
                            showNewPassword
                              ? "Hide new password"
                              : "Show new password"
                          }
                        >
                          {showNewPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              {/* Password Strength */}
              <Box className="password-strength">
                <Box className="password-strength-track">
                  <Box
                    className="password-strength-fill"
                    sx={{
                      width: `${passwordStrength.score}%`,
                      backgroundColor: passwordStrength.color,
                    }}
                  />
                </Box>

                <Stack
                  direction="row"
                  sx={{
                    justifyContent: "space-between",
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Password strength
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{
                      color: passwordStrength.color,
                    }}
                  >
                    {passwordStrength.label}
                  </Typography>
                </Stack>
              </Box>

              <Divider />

              {/* Confirm Password */}
              <TextField
                label="Confirm new password"
                type={showNewPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                fullWidth
                required
                autoComplete="new-password"
                error={passwordMismatch}
                color={passwordsMatch ? "success" : "primary"}
                helperText={
                  passwordMismatch
                    ? "Passwords do not match."
                    : passwordsMatch
                      ? "Passwords match."
                      : " "
                }
                sx={
                  passwordsMatch
                    ? {
                        "& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline":
                          {
                            borderColor: "success.main",
                          },
                      }
                    : undefined
                }
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() =>
                            setShowNewPassword((previous) => !previous)
                          }
                          edge="end"
                          aria-label={
                            showNewPassword
                              ? "Hide new password"
                              : "Show new password"
                          }
                        >
                          {showNewPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              {/* Update Password */}
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isSubmitting}
                sx={{
                  minHeight: 48,
                  textTransform: "none",
                }}
              >
                {isSubmitting ? (
                  <CircularProgress size={22} color="inherit" />
                ) : (
                  "Update password"
                )}
              </Button>

              {/* Back to Login */}
              <Button
                type="button"
                variant="outlined"
                size="large"
                disabled={isSubmitting}
                onClick={() => {
                  setNewPassword("");
                  setConfirmPassword("");
                  closeSnackbar();
                  onBackToLogin?.();
                }}
                sx={{
                  minHeight: 48,
                  textTransform: "none",
                }}
              >
                Back to login
              </Button>
            </Stack>
          </Box>

          <Stack
            direction="row"
            sx={{
              justifyContent: "space-between",
            }}
            className="reset-password-footer"
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default ResetPassword;
