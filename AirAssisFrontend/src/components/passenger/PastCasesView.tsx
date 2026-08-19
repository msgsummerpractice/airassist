import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from "@mui/material";
import AddTaskOutlinedIcon from "@mui/icons-material/AddTaskOutlined";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import { useNavigate } from "react-router-dom";

import PortalUserHeader from "../portal/PortalUserHeader";
import { getStoredUserIdentity, setStoredUserIdentity } from "../../utils/auth";
import { getCaseStatusPresentation } from "../../utils/caseStatus";
import CaseListFilters from "../cases/shared/list/CaseListFilters";
import { AppSnackbar } from "../utils/app_snackbar";
import { useAppSnackbar } from "../utils/use_app_snackbar";
import {
  CaseListEmptyState,
  CaseListLoadingState,
} from "../cases/shared/list/CaseListStates";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
const ACCESS_TOKEN_STORAGE_KEY = "airassist_access_token";

const STATUS_FILTER_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "IN_REVIEW", label: "In review" },
  { value: "ELIGIBLE", label: "Eligible" },
  { value: "NON_ELIGIBLE", label: "Non-eligible" },
  { value: "AWAITING_DOCUMENTS", label: "Awaiting documents" },
];

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

function PastCasesView({
  onLogout,
  onUnauthorized,
  onOpenCaseDetails,
}: PastCasesViewProps) {
  const navigate = useNavigate();
  const { snackbar, closeSnackbar, showSuccessSnackbar } = useAppSnackbar();
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

  const caseIdSortDirection = sorting === "id" ? "asc" : "desc";
  const statusSortDirection = sorting === "-status" ? "desc" : "asc";

  const handleCaseIdSort = () => {
    setSorting((previousSorting) => (previousSorting === "-id" ? "id" : "-id"));
  };

  const handleStatusSort = () => {
    setSorting((previousSorting) =>
      previousSorting === "status" ? "-status" : "status",
    );
  };

  const handleContractDownload = () => {
    showSuccessSnackbar("Contract downloaded successfully.");
  };

  const currentUser = getStoredUserIdentity();

  return (
    <>
      <AppSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
      <Box
        sx={{
          minHeight: "100vh",
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

        <Box
          sx={{
            maxWidth: 1220,
            mx: "auto",
            px: { xs: 2, md: 4 },
            py: { xs: 3, md: 5 },
          }}
        >
          <Card
            elevation={1}
            sx={{
              maxWidth: 1220,
              mx: "auto",
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
                  <Typography variant="h2" sx={{ mt: 0.5 }}>
                    Your Past Cases
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mt: 0.5, maxWidth: 720, mx: "auto" }}
                  ></Typography>
                </Box>
              </Box>

              <CaseListFilters
                statusFilter={statusFilter}
                statusOptions={STATUS_FILTER_OPTIONS}
                assigneeFilter={assigneeFilter}
                assigneeOptions={assigneeOptions}
                statusLabelId="past-cases-status-label"
                assigneeLabelId="past-cases-assignee-label"
                onStatusChange={setStatusFilter}
                onAssigneeChange={setAssigneeFilter}
              />

              {errorMessage && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {errorMessage}
                </Alert>
              )}

              {isLoading ? (
                <CaseListLoadingState label="Loading your cases..." />
              ) : displayedCases.length === 0 ? (
                <CaseListEmptyState />
              ) : (
                <Box
                  sx={{
                    maxHeight: { xs: 520, md: 640 },
                    overflowY: "auto",
                    px: 1,
                    scrollbarGutter: "stable both-edges",
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
                          <TableCell
                            sx={{ textAlign: "center" }}
                            sortDirection={caseIdSortDirection}
                          >
                            <TableSortLabel
                              active={sorting === "id" || sorting === "-id"}
                              direction={caseIdSortDirection}
                              onClick={handleCaseIdSort}
                            >
                              Case ID
                            </TableSortLabel>
                          </TableCell>
                          <TableCell sx={{ textAlign: "center" }}>
                            Flight Number
                          </TableCell>
                          <TableCell sx={{ textAlign: "center" }}>
                            Passenger Name
                          </TableCell>
                          <TableCell
                            sx={{ textAlign: "center" }}
                            sortDirection={statusSortDirection}
                          >
                            <TableSortLabel
                              active={
                                sorting === "status" || sorting === "-status"
                              }
                              direction={statusSortDirection}
                              onClick={handleStatusSort}
                            >
                              Status
                            </TableSortLabel>
                          </TableCell>
                          <TableCell sx={{ textAlign: "center" }}>
                            Assignee
                          </TableCell>
                          <TableCell sx={{ textAlign: "center" }}>
                            Contract
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {displayedCases.map((item) => (
                          <TableRow key={item.id} hover>
                            <TableCell
                              sx={{ fontSize: "0.875rem", textAlign: "center" }}
                            >
                              <Button
                                variant="text"
                                onClick={() => onOpenCaseDetails?.(item.id)}
                                sx={{
                                  minWidth: 0,
                                  px: 0,
                                  textTransform: "none",
                                }}
                              >
                                #{item.id}
                              </Button>
                            </TableCell>
                            <TableCell
                              sx={{ fontSize: "0.875rem", textAlign: "center" }}
                            >
                              {item.flight_number ?? "-"}
                            </TableCell>
                            <TableCell
                              sx={{ fontSize: "0.875rem", textAlign: "center" }}
                            >
                              {item.passenger_name ?? "-"}
                            </TableCell>
                            <TableCell
                              sx={{
                                fontSize: "1.125rem",
                                textAlign: "center",
                                display: "table-cell",
                                verticalAlign: "middle",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                }}
                              >
                                <Chip
                                  size="small"
                                  label={
                                    getCaseStatusPresentation(item.status).label
                                  }
                                  color={
                                    getCaseStatusPresentation(item.status).color
                                  }
                                  sx={getCaseStatusPresentation(item.status).sx}
                                  variant="outlined"
                                />
                              </div>
                            </TableCell>
                            <TableCell
                              sx={{ fontSize: "0.875rem", textAlign: "center" }}
                            >
                              {item.assignee ?? "Unassigned"}
                            </TableCell>
                            <TableCell
                              sx={{ fontSize: "0.875rem", textAlign: "center" }}
                            >
                              {item.contract_download_url ? (
                                <Button
                                  component="a"
                                  href={item.contract_download_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={handleContractDownload}
                                  size="small"
                                  variant="text"
                                  endIcon={
                                    <OpenInNewOutlinedIcon fontSize="small" />
                                  }
                                  sx={{ px: 0, minWidth: 0 }}
                                ></Button>
                              ) : (
                                ""
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Stack
                    spacing={1.5}
                    sx={{ display: { xs: "flex", md: "none" } }}
                  >
                    {displayedCases.map((item) => (
                      <Card key={item.id} variant="outlined">
                        <CardContent>
                          <Stack spacing={1}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
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
                            <Typography
                              variant="body1"
                              sx={{ fontWeight: 600 }}
                            >
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
                                  onClick={handleContractDownload}
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
                                label={
                                  getCaseStatusPresentation(item.status).label
                                }
                                color={
                                  getCaseStatusPresentation(item.status).color
                                }
                                sx={getCaseStatusPresentation(item.status).sx}
                                variant="outlined"
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
      </Box>
    </>
  );
}

export default PastCasesView;
