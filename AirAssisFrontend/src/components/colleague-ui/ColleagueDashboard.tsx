import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ColleagueDashboard.css";

import AddTaskOutlinedIcon from "@mui/icons-material/AddTaskOutlined";
import ArrowOutwardOutlinedIcon from "@mui/icons-material/ArrowOutwardOutlined";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import ColleagueCaseList from "./ColleagueCaseList";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import {
  Alert,
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
import PortalUserHeader from "../portal/PortalUserHeader";
import {
  clearStoredUserIdentity,
  setStoredUserIdentity,
} from "../../utils/auth";
import { getCaseStatusPresentation } from "../../utils/caseStatus";

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

function ColleagueDashboard({ onCreateCase }: ColleagueDashboardProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClaimsVisible, setIsClaimsVisible] = useState(false);

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
        setStoredUserIdentity({
          name:
            payload.data.colleague.full_name ||
            `${payload.data.colleague.firstname} ${payload.data.colleague.lastname}`.trim(),
          email: payload.data.colleague.email,
        });
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

  const handleLogout = () => {
    localStorage.removeItem("airassist_access_token");
    localStorage.removeItem("airassist_refresh_token");
    clearStoredUserIdentity();
    navigate("/case-entry", { replace: true });
    window.location.reload();
  };

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
          <PortalUserHeader
            name={isLoading ? "Colleague" : displayName}
            email={colleague?.email || "Email unavailable"}
            roleLabel="Colleague"
            logoutAction={{
              label: "Log Out",
              icon: <LogoutOutlinedIcon fontSize="small" />,
              onClick: handleLogout,
            }}
            actions={[
              {
                label: "See Cases",
                icon: <VisibilityOutlinedIcon fontSize="small" />,
                onClick: () => navigate("/colleague-cases"),
              },
              {
                label: "Create Case",
                icon: <AddTaskOutlinedIcon fontSize="small" />,
                onClick: onCreateCase,
              },
            ]}
          />

          {/* Active Claims */}
          <Card elevation={0} className="colleague-dashboard__claims-card">
            {isRefreshing ? (
              <LinearProgress className="colleague-dashboard__progress" />
            ) : null}

            <CardContent className="colleague-dashboard__claims-content">
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                sx={{
                  justifyContent: "flex-end",
                  alignItems: { xs: "stretch", md: "center" },
                }}
              >
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  {!isLoading && !hasError ? (
                    <Chip
                      icon={<DashboardOutlinedIcon />}
                      label={`${claims.length} assigned`}
                      color="primary"
                      variant="outlined"
                    />
                  ) : null}
                  <Button
                    variant={isClaimsVisible ? "contained" : "outlined"}
                    color="primary"
                    startIcon={<AssignmentTurnedInOutlinedIcon />}
                    onClick={() => setIsClaimsVisible((current) => !current)}
                  >
                    {isClaimsVisible
                      ? "Hide Assigned Cases"
                      : "Show Assigned Cases"}
                  </Button>
                </Stack>
              </Stack>

              <Divider />

              {!isClaimsVisible ? null : isLoading ? (
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
                <TableContainer
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                  }}
                >
                  <Table stickyHeader>
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
                              label={
                                getCaseStatusPresentation(claim.status).label
                              }
                              color={
                                getCaseStatusPresentation(claim.status).color
                              }
                              size="small"
                              sx={getCaseStatusPresentation(claim.status).sx}
                              variant="outlined"
                            />
                          </TableCell>

                          <TableCell>{formatDate(claim.created_at)}</TableCell>

                          <TableCell align="right">
                            <Tooltip title="Open case details">
                              <IconButton
                                size="small"
                                className="colleague-dashboard__action-button"
                                onClick={() =>
                                  navigate(`/colleague-cases/${claim.case_id}`)
                                }
                              >
                                <ArrowOutwardOutlinedIcon fontSize="small" />
                              </IconButton>
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
          <ColleagueCaseList />
        </Stack>
      </Box>
    </Box>
  );
}

export default ColleagueDashboard;
