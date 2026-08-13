import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import AddTaskOutlinedIcon from "@mui/icons-material/AddTaskOutlined";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import { useNavigate } from "react-router-dom";

import PortalUserHeader from "../portal/PortalUserHeader";
import { getStoredUserIdentity, setStoredUserIdentity } from "../../utils/auth";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
const ACCESS_TOKEN_STORAGE_KEY = "airassist_access_token";

type PassengerCase = {
  id: number;
  flight_number: string | null;
  passenger_name: string | null;
  status: string;
  assignee: string | null;
  contract_download_url: string | null;
};

type SortValue = "-id" | "id" | "status" | "-status";

type PastCasesViewProps = {
  onLogout: () => void;
  onUnauthorized?: () => void;
  onOpenCaseDetails?: (caseId: number) => void;
};

function mapStatusToChipColor(
  status: string,
): "default" | "primary" | "secondary" | "success" | "warning" | "error" {
  switch (status) {
    case "NEW":
      return "success";
    case "VALID":
      return "success";
    case "ASSIGNED":
      return "primary";
    case "INVALID":
      return "error";
    default:
      return "default";
  }
}

function PastCasesView({
  onLogout,
  onUnauthorized,
  onOpenCaseDetails,
}: PastCasesViewProps) {
  const navigate = useNavigate();
  const [cases, setCases] = useState<PassengerCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState("ALL");
  const [sorting, setSorting] = useState<SortValue>("-id");

  const fetchCases = useCallback(async () => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);

    if (!accessToken) {
      onUnauthorized?.();
      return;
    }

    // Defer state updates so the effect body does not synchronously trigger cascaded renders.
    await Promise.resolve();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const queryParams = new URLSearchParams();
      queryParams.set("ordering", sorting);

      if (statusFilter !== "ALL") {
        queryParams.set("status", statusFilter);
      }

      const response = await fetch(
        `${API_BASE_URL}/api/cases/me/?${queryParams.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (response.status === 401 || response.status === 403) {
        onUnauthorized?.();
        return;
      }

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(responseText || "Could not load your cases.");
      }

      const payload = (await response.json()) as PassengerCase[];
      if (payload[0]?.passenger_name) {
        setStoredUserIdentity({ name: payload[0].passenger_name });
      }
      setCases(payload);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Could not load your cases.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [onUnauthorized, sorting, statusFilter]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchCases();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [fetchCases]);

  const assigneeOptions = useMemo(() => {
    const values = cases
      .map((item) => item.assignee)
      .filter((item): item is string => !!item)
      .sort((first, second) => first.localeCompare(second));

    return Array.from(new Set(values));
  }, [cases]);

  const displayedCases = useMemo(() => {
    if (assigneeFilter === "ALL") {
      return cases;
    }

    return cases.filter(
      (item) => (item.assignee ?? "UNASSIGNED") === assigneeFilter,
    );
  }, [cases, assigneeFilter]);

  const currentUser = getStoredUserIdentity();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        px: { xs: 2, md: 4 },
        py: { xs: 3, md: 5 },
        backgroundColor: "#ffffff",
      }}
    >
      <PortalUserHeader
        name={currentUser.name}
        email={currentUser.email}
        roleLabel={currentUser.roleLabel}
        logoutAction={{
          label: "Log Out",
          icon: <LogoutOutlinedIcon fontSize="small" />,
          onClick: onLogout,
        }}
        actions={[
          {
            label: "My Cases",
            active: true,
            icon: <AssignmentTurnedInOutlinedIcon fontSize="small" />,
            onClick: () => navigate("/passenger-cases"),
          },
          {
            label: "New Claim",
            icon: <AddTaskOutlinedIcon fontSize="small" />,
            onClick: () => navigate("/case-entry"),
          },
        ]}
      />

      <Card
        elevation={1}
        sx={{
          maxWidth: 1220,
          mx: "auto",
          mt: 3,
          border: "none",
          overflow: "hidden",
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 4 } }}>
          <Box
            sx={{
              position: "relative",
              mb: 3,
              pb: { xs: 1, md: 0 },
            }}
          >
            <Box
              sx={{
                width: "100%",
                textAlign: "center",
                px: { xs: 0, md: 10 },
              }}
            >
              <Typography variant="caption" color="secondary.main">
                AIRASSIST PORTAL
              </Typography>
              <Typography variant="h2" sx={{ mt: 0.5 }}>
                Your Past Cases
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mt: 0.5, maxWidth: 720, mx: "auto" }}
              >
                Review submitted compensation cases and current handling status.
              </Typography>
            </Box>
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{
              mb: 3,
              width: "100%",
              justifyContent: "center",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <FormControl size="small" sx={{ minWidth: 180, flex: "1 1 180px" }}>
              <InputLabel id="past-cases-status-label">Status</InputLabel>
              <Select
                labelId="past-cases-status-label"
                label="Status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <MenuItem value="ALL">All</MenuItem>
                <MenuItem value="NEW">New</MenuItem>
                <MenuItem value="VALID">Valid</MenuItem>
                <MenuItem value="ASSIGNED">Assigned</MenuItem>
                <MenuItem value="INVALID">Invalid</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 220, flex: "1 1 220px" }}>
              <InputLabel id="past-cases-assignee-label">Assignee</InputLabel>
              <Select
                labelId="past-cases-assignee-label"
                label="Assignee"
                value={assigneeFilter}
                onChange={(event) => setAssigneeFilter(event.target.value)}
              >
                <MenuItem value="ALL">All</MenuItem>
                <MenuItem value="UNASSIGNED">Unassigned</MenuItem>
                {assigneeOptions.map((assigneeName) => (
                  <MenuItem key={assigneeName} value={assigneeName}>
                    {assigneeName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 220, flex: "1 1 220px" }}>
              <InputLabel id="past-cases-sort-label">Sort by</InputLabel>
              <Select
                labelId="past-cases-sort-label"
                label="Sort by"
                value={sorting}
                onChange={(event) =>
                  setSorting(event.target.value as SortValue)
                }
              >
                <MenuItem value="-id">Newest first</MenuItem>
                <MenuItem value="id">Oldest first</MenuItem>
                <MenuItem value="status">Status (A-Z)</MenuItem>
                <MenuItem value="-status">Status (Z-A)</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {errorMessage && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errorMessage}
            </Alert>
          )}

          {isLoading ? (
            <Box
              sx={{
                py: 8,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 1,
              }}
            >
              <CircularProgress size={28} />
              <Typography variant="body1" color="text.secondary">
                Loading your cases...
              </Typography>
            </Box>
          ) : displayedCases.length === 0 ? (
            <Box
              sx={{
                py: 6,
                borderRadius: 2,
                border: "1px dashed",
                borderColor: "divider",
                textAlign: "center",
              }}
            >
              <Typography variant="body1" color="text.secondary">
                No cases found for current filters.
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                maxHeight: { xs: 520, md: 640 },
                overflowY: "auto",
                pr: 1,
                scrollbarGutter: "stable",
              }}
            >
              <TableContainer
                sx={{
                  display: { xs: "none", md: "block" },
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                }}
              >
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Case ID</TableCell>
                      <TableCell>Flight Number</TableCell>
                      <TableCell>Passenger Name</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Assignee</TableCell>
                      <TableCell>Contract</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {displayedCases.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Button
                            variant="text"
                            onClick={() => onOpenCaseDetails?.(item.id)}
                            sx={{ minWidth: 0, px: 0, textTransform: "none" }}
                          >
                            #{item.id}
                          </Button>
                        </TableCell>
                        <TableCell>{item.flight_number ?? "-"}</TableCell>
                        <TableCell>{item.passenger_name ?? "-"}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={item.status}
                            color={mapStatusToChipColor(item.status)}
                            variant={
                              item.status === "ASSIGNED" ? "filled" : "outlined"
                            }
                          />
                        </TableCell>
                        <TableCell>{item.assignee ?? "Unassigned"}</TableCell>
                        <TableCell>
                          {item.contract_download_url ? (
                            <Button
                              component="a"
                              href={item.contract_download_url}
                              target="_blank"
                              rel="noreferrer"
                              size="small"
                              variant="text"
                              endIcon={
                                <OpenInNewOutlinedIcon fontSize="small" />
                              }
                              sx={{ px: 0, minWidth: 0 }}
                            >
                              PDF
                            </Button>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Stack spacing={1.5} sx={{ display: { xs: "flex", md: "none" } }}>
                {displayedCases.map((item) => (
                  <Card key={item.id} variant="outlined">
                    <CardContent>
                      <Stack spacing={1}>
                        <Typography variant="caption" color="text.secondary">
                          <Button
                            variant="text"
                            onClick={() => onOpenCaseDetails?.(item.id)}
                            sx={{
                              minWidth: 0,
                              px: 0,
                              py: 0,
                              textTransform: "none",
                            }}
                          >
                            CASE #{item.id}
                          </Button>
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          Flight {item.flight_number ?? "-"}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          Passenger: {item.passenger_name ?? "-"}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          Assignee: {item.assignee ?? "Unassigned"}
                        </Typography>
                        {item.contract_download_url ? (
                          <Box>
                            <Button
                              component="a"
                              href={item.contract_download_url}
                              target="_blank"
                              rel="noreferrer"
                              size="small"
                              variant="outlined"
                              endIcon={
                                <OpenInNewOutlinedIcon fontSize="small" />
                              }
                            >
                              Download contract
                            </Button>
                          </Box>
                        ) : null}
                        <Box>
                          <Chip
                            size="small"
                            label={item.status}
                            color={mapStatusToChipColor(item.status)}
                            variant={
                              item.status === "ASSIGNED" ? "filled" : "outlined"
                            }
                          />
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default PastCasesView;
