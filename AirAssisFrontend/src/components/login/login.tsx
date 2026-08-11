import { useState } from "react";
import type { FormEvent } from "react";
import "./login.css";
import {
  Alert,
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

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

type LoginApiResponse = {
  access?: string;
  refresh?: string;
  must_change_password?: boolean;
  detail?: string;
  message?: string;
};

type TokenPairResponse = {
  access: string;
  refresh: string;
};

type LoginProps = {
  onLoginSuccess?: () => void;
  onPasswordResetSuccess?: () => void;
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
    return { label: "", score: 0, color: "#c3c6d4" };
  }

  let score = 0;

  if (value.length >= 8) score += 1;
  if (/[A-Z]/.test(value) || /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  if (value.length >= 12) score += 1;

  if (score <= 2) {
    return { label: "Weak", score: 25, color: "#ba1a1a" };
  }

  if (score === 3) {
    return { label: "Medium", score: 50, color: "#c77700" };
  }

  if (score === 4) {
    return { label: "Strong", score: 75, color: "#1b6d24" };
  }

  return { label: "Very strong", score: 100, color: "#003178" };
};

const Login = ({ onLoginSuccess, onPasswordResetSuccess }: LoginProps) => {
  const [step, setStep] = useState<"login" | "reset">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [accessToken, setAccessToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const passwordMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;
  const passwordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordStrength = getPasswordStrength(newPassword);
  const fetchTokenPair = async (
    loginEmail: string,
    loginPassword: string,
  ): Promise<TokenPairResponse> => {
    const response = await fetch(`${API_BASE_URL}/user/token/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: loginEmail,
        password: loginPassword,
      }),
    });

    const data = await readJsonSafely<TokenPairResponse & { detail?: string }>(
      response,
    );

    if (!response.ok || !data?.access || !data?.refresh) {
      throw new Error(
        data?.detail || "Could not obtain authentication tokens.",
      );
    }

    return {
      access: data.access,
      refresh: data.refresh,
    };
  };

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const loginResponse = await fetch(`${API_BASE_URL}/user/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const loginData = await readJsonSafely<LoginApiResponse>(loginResponse);

      if (!loginResponse.ok) {
        throw new Error(
          loginData?.detail ||
            loginData?.message ||
            "Login failed. Please check your email and password.",
        );
      }

      let tokens: TokenPairResponse;

      if (loginData?.access && loginData?.refresh) {
        tokens = {
          access: loginData.access,
          refresh: loginData.refresh,
        };
      } else {
        tokens = await fetchTokenPair(email, password);
      }

      setAccessToken(tokens.access);
      localStorage.setItem("airassist_access_token", tokens.access);
      localStorage.setItem(
        "airassist_refresh_token",
        loginData?.refresh ?? tokens.refresh,
      );

      if (loginData?.must_change_password) {
        setStep("reset");
        return;
      }

      setSuccessMessage("Login successful.");
      onLoginSuccess?.();
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Login failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (passwordMismatch) {
      setErrorMessage("The new passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage("The new password must be at least 8 characters long.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const currentAccessToken =
        accessToken || localStorage.getItem("airassist_access_token");

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

      const data = await readJsonSafely<{ message?: string; error?: string }>(
        response,
      );

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Password change failed. Please try again.",
        );
      }

      setSuccessMessage(data?.message || "Password changed successfully.");
      onPasswordResetSuccess?.();
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Password change failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box className="login-page">
      <Card elevation={3} className="login-card">
        <CardContent className="login-card-content">
          <Stack spacing={1.5} className="login-header">
            <Typography variant="caption" color="secondary.main">
              AIRASSIST PORTAL
            </Typography>
          </Stack>

          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

          {successMessage ? (
            <Alert severity="success">{successMessage}</Alert>
          ) : null}

          {step === "login" ? (
            <Box
              sx={{ textAlign: "left" }}
              component="form"
              onSubmit={handleLoginSubmit}
              noValidate
            >
              <Stack spacing={2.5}>
                {/* Email Address */}
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 0.75,
                      fontWeight: 500,
                      color: "text.primary",
                    }}
                  >
                    Email Address
                  </Typography>

                  <TextField
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    fullWidth
                    required
                    autoComplete="email"
                  />
                </Box>

                {/* Password */}
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 0.75,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        color: "text.primary",
                      }}
                    >
                      Password
                    </Typography>

                    <Button
                      type="button"
                      variant="text"
                      onClick={() => {
                        setStep("reset");
                        setErrorMessage("");
                        setSuccessMessage("");
                      }}
                      sx={{
                        minWidth: 0,
                        padding: 0,
                        textTransform: "none",
                        fontSize: "0.875rem",
                        color: "primary.main",
                        "&:hover": {
                          backgroundColor: "transparent",
                          textDecoration: "underline",
                        },
                      }}
                    >
                      Forgot Password?
                    </Button>
                  </Box>

                  <TextField
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    fullWidth
                    required
                    autoComplete="current-password"
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() =>
                                setShowPassword((previous) => !previous)
                              }
                              edge="end"
                              aria-label={
                                showPassword ? "Hide password" : "Show password"
                              }
                            >
                              {showPassword ? (
                                <VisibilityOff />
                              ) : (
                                <Visibility />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Box>

                {/* Sign In Button */}
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
                    "Log In"
                  )}
                </Button>
              </Stack>
            </Box>
          ) : (
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
                  helperText={
                    newPassword
                      ? `Strength: ${passwordStrength.label}`
                      : "Use at least 8 characters."
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
                            {showNewPassword ? (
                              <VisibilityOff />
                            ) : (
                              <Visibility />
                            )}
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
                            {showNewPassword ? (
                              <VisibilityOff />
                            ) : (
                              <Visibility />
                            )}
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
                    setStep("login");
                    setNewPassword("");
                    setConfirmPassword("");
                    setErrorMessage("");
                    setSuccessMessage("");
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
          )}

          <Stack
            direction="row"
            sx={{
              justifyContent: "space-between",
            }}
            className="login-footer"
          ></Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
