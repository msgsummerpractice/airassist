import { useState } from "react";
import type { FormEvent } from "react";
import "./login.css";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import ResetPassword from "./reset_password";
import { AppSnackbar } from "../utils/app_snackbar";
import { useAppSnackbar } from "../utils/use_app_snackbar";
import { setStoredUserIdentity } from "../../utils/auth";

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
  onLoginSuccess?: () => void | Promise<boolean>;
  onPasswordResetSuccess?: () => void;
};

type PasswordResetMode = "change-password" | "request-reset";

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

const Login = ({ onLoginSuccess, onPasswordResetSuccess }: LoginProps) => {
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [passwordResetMode, setPasswordResetMode] =
    useState<PasswordResetMode>("request-reset");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { snackbar, closeSnackbar, showErrorSnackbar, showSuccessSnackbar } =
    useAppSnackbar();

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

    closeSnackbar();
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

      localStorage.setItem("airassist_access_token", tokens.access);
      setStoredUserIdentity({ email });

      localStorage.setItem(
        "airassist_refresh_token",
        loginData?.refresh ?? tokens.refresh,
      );

      if (loginData?.must_change_password) {
        setPasswordResetMode("change-password");
        setShowPasswordReset(true);
        return;
      }

      const resolved = await onLoginSuccess?.();
      if (resolved === false) {
        showErrorSnackbar(
          "Login succeeded, but we couldn't load your account. Please try again.",
        );
        return;
      }

      showSuccessSnackbar("Login successful.");
    } catch (error) {
      if (error instanceof Error) {
        showErrorSnackbar(error.message);
      } else {
        showErrorSnackbar("Login failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showPasswordReset) {
    return (
      <ResetPassword
        mode={passwordResetMode}
        onPasswordResetSuccess={onPasswordResetSuccess}
        onBackToLogin={() => {
          setShowPasswordReset(false);
          closeSnackbar();
        }}
      />
    );
  }

  return (
    <Box className="login-page">
      <AppSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />

      <Card elevation={3} className="login-card">
        <CardContent className="login-card-content">
          <Stack spacing={1.5} className="login-header">
            <Typography variant="caption" color="secondary.main">
              AIRASSIST PORTAL
            </Typography>
          </Stack>

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
                      setPasswordResetMode("request-reset");
                      setShowPasswordReset(true);
                      closeSnackbar();
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
                            {showPassword ? <VisibilityOff /> : <Visibility />}
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

          <Stack
            direction="row"
            sx={{
              justifyContent: "space-between",
            }}
            className="login-footer"
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
