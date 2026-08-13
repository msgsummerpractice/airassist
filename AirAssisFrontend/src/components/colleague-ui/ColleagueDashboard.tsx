import { useEffect, useMemo, useState } from "react";
import "./ColleagueDashboard.css";

import AddTaskOutlinedIcon from "@mui/icons-material/AddTaskOutlined";
import ArrowOutwardOutlinedIcon from "@mui/icons-material/ArrowOutwardOutlined";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  LinearProgress,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";

import { AppSnackbar } from "../utils/app_snackbar";
import { useAppSnackbar } from "../utils/use_app_snackbar";

type DashboardColleague = {
  id: number;
  firstname: string;
  lastname: string;
  full_name: string;
  email: string;
  role?: string | null;
  avatar_url?: string | null;
};

type DashboardClaim = {
  case_id: number;
  status: string;
  created_at: string;
  reservation_number?: string | null;
  passenger_name?: string | null;
};

type DashboardResponse = {
  success?: boolean;
  data?: {
    colleague?: DashboardColleague;
    claims?: DashboardClaim[];
  };
};

type ColleagueDashboardProps = {
  onCreateCase: () => void;
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

const statusColorMap: Record<string, "warning" | "success" | "error" | "info"> =
  {
    NEW: "warning",
    VALID: "success",
    INVALID: "error",
    ASSIGNED: "info",
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

const formatStatusLabel = (status: string) =>
  status.charAt(0) + status.slice(1).toLowerCase();

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getAvatarLabel = (colleague: DashboardColleague | null) => {
  if (!colleague) {
    return "C";
  }

  const firstInitial = colleague.firstname?.charAt(0) ?? "";
  const lastInitial = colleague.lastname?.charAt(0) ?? "";

  return `${firstInitial}${lastInitial}`.trim() || "C";
};

function ColleagueDashboard({ onCreateCase }: ColleagueDashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [colleague, setColleague] = useState<DashboardColleague | null>(null);

  const [claims, setClaims] = useState<DashboardClaim[]>([]);
  const [hasError, setHasError] = useState(false);

  const { snackbar, closeSnackbar, showErrorSnackbar } = useAppSnackbar();

  useEffect(() => {
    let isActive = true;

    const loadDashboard = async () => {
      const accessToken = localStorage.getItem("airassist_access_token");

      if (!accessToken) {
        if (isActive) {
          setHasError(true);
          setIsLoading(false);

          showErrorSnackbar("Your session has expired. Please log in again.");
        }

        return;
      }

      if (isActive) {
        setIsRefreshing(true);
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/cases/colleague/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const payload = await readJsonSafely<DashboardResponse>(response);

        if (!response.ok || !payload?.data?.colleague) {
          throw new Error("Could not load dashboard data.");
        }

        if (!isActive) {
          return;
        }

        setColleague(payload.data.colleague);
        setClaims(payload.data.claims ?? []);
        setHasError(false);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setHasError(true);
        setClaims([]);

        showErrorSnackbar(
          error instanceof Error
            ? error.message
            : "Could not load dashboard data.",
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      isActive = false;
    };
  }, [showErrorSnackbar]);

  const displayName = useMemo(() => {
    if (!colleague) {
      return "Colleague Dashboard";
    }

    return (
      colleague.full_name ||
      `${colleague.firstname} ${colleague.lastname}`.trim()
    );
  }, [colleague]);

  return (
    <Box className="colleague-dashboard">
      <AppSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />

      <Box className="colleague-dashboard__shell">
        <Stack spacing={3}>
          {/* Profile Card */}
          <Card elevation={0} className="colleague-dashboard__profile-card">
            {isRefreshing ? (
              <LinearProgress className="colleague-dashboard__progress" />
            ) : null}

            <CardContent className="colleague-dashboard__profile-content">
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={3}
                className="colleague-dashboard__profile-layout"
              >
                {/* Colleague Identity */}
                <Stack
                  direction="row"
                  spacing={2.5}
                  className="colleague-dashboard__identity"
                >
                  {isLoading ? (
                    <Skeleton variant="circular" width={92} height={92} />
                  ) : (
                    <Avatar
                      src={colleague?.avatar_url ?? undefined}
                      className="colleague-dashboard__avatar"
                    >
                      {getAvatarLabel(colleague)}
                    </Avatar>
                  )}

                  <Stack
                    spacing={1}
                    className="colleague-dashboard__identity-copy"
                  >
                    {isLoading ? (
                      <>
                        <Skeleton variant="text" width={220} height={44} />

                        <Skeleton variant="text" width={150} height={26} />
                      </>
                    ) : (
                      <>
                        <Typography
                          variant="h1"
                          className="colleague-dashboard__identity-title"
                        >
                          {displayName}
                        </Typography>

                        <Typography variant="body1" color="text.secondary">
                          Claims Adjudicator
                        </Typography>

                        <Typography
                          variant="caption"
                          className="colleague-dashboard__identity-meta"
                        >
                          {colleague?.email}
                        </Typography>
                      </>
                    )}
                  </Stack>
                </Stack>

                {/* Create Case Button */}
                <Box className="colleague-dashboard__profile-action">
                  <Button
                    variant="contained"
                    color="secondary"
                    size="large"
                    onClick={onCreateCase}
                    startIcon={<AddTaskOutlinedIcon />}
                    className="colleague-dashboard__create-button"
                  >
                    Create Entry Form
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Active Claims */}
          <Card elevation={0} className="colleague-dashboard__claims-card">
            <CardContent className="colleague-dashboard__claims-content">
              <Stack
                direction="row"
                spacing={2}
                sx={{
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{
                    alignItems: "center",
                  }}
                >
                  <Box className="colleague-dashboard__section-icon">
                    <AssignmentTurnedInOutlinedIcon fontSize="small" />
                  </Box>

                  <Box>
                    <Typography variant="body1" color="text.secondary">
                      Cases currently assigned to you.
                    </Typography>
                  </Box>
                </Stack>

                {!isLoading && !hasError ? (
                  <Chip
                    icon={<DashboardOutlinedIcon />}
                    label={`${claims.length} assigned`}
                    color="primary"
                    variant="outlined"
                  />
                ) : null}
              </Stack>

              <Divider />

              {/* Loading */}
              {isLoading ? (
                <Stack
                  spacing={1.5}
                  className="colleague-dashboard__table-skeleton"
                >
                  <Skeleton variant="rounded" height={46} />

                  <Skeleton variant="rounded" height={46} />

                  <Skeleton variant="rounded" height={46} />

                  <Skeleton variant="rounded" height={46} />
                </Stack>
              ) : hasError ? (
                /* Error */
                <Alert severity="error" variant="outlined">
                  We could not load your active claims right now.
                </Alert>
              ) : claims.length === 0 ? (
                /* Empty */
                <Box className="colleague-dashboard__empty-state">
                  <Typography variant="body1" color="text.secondary">
                    When a case is assigned to your account, it will appear
                    here.
                  </Typography>
                </Box>
              ) : (
                /* Claims Table */
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Claim ID</TableCell>

                        <TableCell>Passenger</TableCell>

                        <TableCell>Status</TableCell>

                        <TableCell>Created</TableCell>

                        <TableCell align="right">Action</TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {claims.map((claim) => (
                        <TableRow key={claim.case_id} hover>
                          <TableCell className="colleague-dashboard__case-id">
                            #{claim.case_id}
                          </TableCell>

                          <TableCell>
                            <Stack spacing={0.35}>
                              <Typography
                                variant="body1"
                                className="colleague-dashboard__passenger-name"
                              >
                                {claim.passenger_name ||
                                  "Passenger unavailable"}
                              </Typography>

                              {claim.reservation_number ? (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Reservation {claim.reservation_number}
                                </Typography>
                              ) : null}
                            </Stack>
                          </TableCell>

                          <TableCell>
                            <Chip
                              label={formatStatusLabel(claim.status)}
                              color={statusColorMap[claim.status] ?? "info"}
                              size="small"
                            />
                          </TableCell>

                          <TableCell>{formatDate(claim.created_at)}</TableCell>

                          <TableCell align="right">
                            <Tooltip title="Case detail navigation is not available in the current app flow.">
                              <span>
                                <IconButton
                                  size="small"
                                  className="colleague-dashboard__action-button"
                                  disabled
                                >
                                  <ArrowOutwardOutlinedIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </Box>
  );
}

export default ColleagueDashboard;
