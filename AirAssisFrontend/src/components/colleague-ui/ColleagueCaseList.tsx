import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ColleagueDashboard.css";

import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import ListAltOutlinedIcon from "@mui/icons-material/ListAltOutlined";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import AssignColleagueButton, {
  type ColleagueOption,
} from "./AssignColleagueButton";
import { fetchWithAuth } from "../../utils/auth";

type ColleagueCaseListItem = {
  id: number;
  case_date: string;
  flight_number: string | null;
  flight_date: string | null;
  passenger_name: string | null;
  status: string;
  assigned_colleague_id: number | null;
  assigned_colleague_name: string | null;
};

type UserListItem = {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
};

type ColleagueCaseListResponse = {
  success?: boolean;
  data?: ColleagueCaseListItem[];
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

const statusColorMap: Record<string, "warning" | "success" | "error" | "info"> =
  {
    NEW: "success",
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

const formatDate = (value: string | null) => {
  if (!value) {
    return "Not available";
  }

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

function ColleagueCaseList() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<ColleagueCaseListItem[]>([]);
  const [colleagues, setColleagues] = useState<ColleagueOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isActive = true;

    const loadCases = async () => {
      try {
        const response = await fetchWithAuth(
          `${API_BASE_URL}/api/cases/colleague/list/`,
        );

        const payload =
          await readJsonSafely<ColleagueCaseListResponse>(response);

        if (!response.ok || !payload?.success || !Array.isArray(payload.data)) {
          throw new Error("Could not load colleague case list.");
        }

        if (!isActive) {
          return;
        }

        setCases(payload.data);
        setHasError(false);
      } catch {
        if (!isActive) {
          return;
        }

        setCases([]);
        setHasError(true);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    const loadColleagues = async () => {
      try {
        const response = await fetchWithAuth(`${API_BASE_URL}/user/colleagues/`);
        const payload = await readJsonSafely<UserListItem[]>(response);

        if (!isActive) {
          return;
        }

        if (!response.ok || !Array.isArray(payload)) {
          setColleagues([]);
          return;
        }

        setColleagues(
            payload.map((user) => ({
                id: user.id,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
            })),
            );
      } catch {
        if (!isActive) {
          return;
        }

        setColleagues([]);
      }
    };

    void loadCases();
    void loadColleagues();

    return () => {
      isActive = false;
    };
  }, [reloadKey]);

  return (
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
              <ListAltOutlinedIcon fontSize="small" />
            </Box>

            <Box>
              <Typography variant="body1" color="text.secondary">
                All cases available to colleagues.
              </Typography>
            </Box>
          </Stack>

          {!isLoading && !hasError ? (
            <Chip
              icon={<DashboardOutlinedIcon />}
              label={`${cases.length} cases`}
              color="primary"
              variant="outlined"
            />
          ) : null}
        </Stack>

        <Divider />

        {isLoading ? (
          <Stack spacing={1.5} className="colleague-dashboard__table-skeleton">
            <Skeleton variant="rounded" height={46} />
            <Skeleton variant="rounded" height={46} />
            <Skeleton variant="rounded" height={46} />
            <Skeleton variant="rounded" height={46} />
          </Stack>
        ) : hasError ? (
          <Alert severity="error" variant="outlined">
            We could not load the colleague case list right now.
          </Alert>
        ) : cases.length === 0 ? (
          <Box className="colleague-dashboard__empty-state">
            <Typography variant="body1" color="text.secondary">
              No cases are available yet.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Case Date</TableCell>
                  <TableCell>Flight Number</TableCell>
                  <TableCell>Flight Date</TableCell>
                  <TableCell>Passenger Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Assigned Colleague</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {cases.map((caseItem) => (
                  <TableRow key={caseItem.id} hover>
                    <TableCell className="colleague-dashboard__case-id">
                      <Button
                        variant="text"
                        onClick={() => navigate(`/colleague-cases/${caseItem.id}`)}
                        sx={{ minWidth: 0, px: 0, textTransform: "none" }}
                      >
                        #{caseItem.id}
                      </Button>
                    </TableCell>

                    <TableCell>{formatDate(caseItem.case_date)}</TableCell>

                    <TableCell>
                      {caseItem.flight_number || "Not available"}
                    </TableCell>

                    <TableCell>{formatDate(caseItem.flight_date)}</TableCell>

                    <TableCell>
                      <Typography
                        variant="body1"
                        className="colleague-dashboard__passenger-name"
                      >
                        {caseItem.passenger_name || "Passenger unavailable"}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={formatStatusLabel(caseItem.status)}
                        color={statusColorMap[caseItem.status] ?? "info"}
                        size="small"
                      />
                    </TableCell>

                    <TableCell>
                      {caseItem.assigned_colleague_name || "Unassigned"}
                    </TableCell>

                    <TableCell align="right">
                      <AssignColleagueButton
                        caseId={caseItem.id}
                        caseStatus={caseItem.status}
                        colleagues={colleagues}
                        assignedColleagueId={caseItem.assigned_colleague_id}
                        onAssigned={() => {
                          setReloadKey((current) => current + 1);
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
}

export default ColleagueCaseList;