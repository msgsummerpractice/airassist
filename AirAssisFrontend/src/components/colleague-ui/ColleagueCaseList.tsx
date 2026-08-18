import { useEffect, useMemo, useState } from "react";
import "./ColleagueDashboard.css";

import {
  Box,
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

import AssignColleagueButton, {
  type ColleagueOption,
} from "./AssignColleagueButton";
import { fetchWithAuth } from "../../utils/auth";
import { getCaseStatusPresentation } from "../../utils/caseStatus";
import CaseListFilters from "../cases/shared/list/CaseListFilters";
import {
  CaseListEmptyState,
  CaseListErrorState,
  CaseListLoadingState,
} from "../cases/shared/list/CaseListStates";
import { formatCaseDate } from "../cases/shared/list/caseListFormatting";

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

type SortValue = "-id" | "id" | "status" | "-status";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

const STATUS_FILTER_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "IN_REVIEW", label: "In review" },
  { value: "ELIGIBLE", label: "Eligible" },
  { value: "NON_ELIGIBLE", label: "Non-eligible" },
  { value: "AWAITING_DOCUMENTS", label: "Awaiting documents" },
];

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

function ColleagueCaseList() {
  const [cases, setCases] = useState<ColleagueCaseListItem[]>([]);
  const [colleagues, setColleagues] = useState<ColleagueOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState("ALL");
  const [sorting, setSorting] = useState<SortValue>("-id");

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
        const response = await fetchWithAuth(
          `${API_BASE_URL}/user/colleagues/`,
        );
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

  const assigneeOptions = useMemo(
    () =>
      Array.from(
        new Set(
          cases
            .map((caseItem) => caseItem.assigned_colleague_name)
            .filter((assigneeName): assigneeName is string =>
              Boolean(assigneeName),
            ),
        ),
      ).sort((first, second) => first.localeCompare(second)),
    [cases],
  );

  const displayedCases = useMemo(() => {
    const filteredCases = cases.filter((caseItem) => {
      const matchesStatus =
        statusFilter === "ALL" || caseItem.status === statusFilter;
      const matchesAssignee =
        assigneeFilter === "ALL" ||
        (assigneeFilter === "UNASSIGNED" &&
          !caseItem.assigned_colleague_name) ||
        caseItem.assigned_colleague_name === assigneeFilter;

      return matchesStatus && matchesAssignee;
    });

    return [...filteredCases].sort((first, second) => {
      if (sorting === "id") {
        return first.id - second.id;
      }

      if (sorting === "-id") {
        return second.id - first.id;
      }

      const statusComparison = first.status.localeCompare(second.status);

      return sorting === "status" ? statusComparison : -statusComparison;
    });
  }, [assigneeFilter, cases, sorting, statusFilter]);

  const caseIdSortDirection = sorting === "id" ? "asc" : "desc";
  const statusSortDirection = sorting === "status" ? "asc" : "desc";

  const handleCaseIdSort = () => {
    setSorting((current) => (current === "-id" ? "id" : "-id"));
  };

  const handleStatusSort = () => {
    setSorting((current) => (current === "status" ? "-status" : "status"));
  };

  return (
    <Card
      elevation={1}
      sx={{
        maxWidth: 1220,
        width: "100%",
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
              All Cases
            </Typography>
          </Box>
        </Box>

        <CaseListFilters
          statusFilter={statusFilter}
          statusOptions={STATUS_FILTER_OPTIONS}
          assigneeFilter={assigneeFilter}
          assigneeOptions={assigneeOptions}
          statusLabelId="colleague-cases-status-label"
          assigneeLabelId="colleague-cases-assignee-label"
          onStatusChange={setStatusFilter}
          onAssigneeChange={setAssigneeFilter}
        />

        {isLoading ? (
          <CaseListLoadingState label="Loading colleague cases..." />
        ) : hasError ? (
          <CaseListErrorState message="We could not load the colleague case list right now." />
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
                    <TableCell sortDirection={caseIdSortDirection}>
                      <TableSortLabel
                        active={sorting === "id" || sorting === "-id"}
                        direction={caseIdSortDirection}
                        onClick={handleCaseIdSort}
                      >
                        Case ID
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Case Date</TableCell>
                    <TableCell>Flight Number</TableCell>
                    <TableCell>Flight Date</TableCell>
                    <TableCell>Passenger Name</TableCell>
                    <TableCell sortDirection={statusSortDirection}>
                      <TableSortLabel
                        active={sorting === "status" || sorting === "-status"}
                        direction={statusSortDirection}
                        onClick={handleStatusSort}
                      >
                        Status
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Assignee</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {displayedCases.map((caseItem) => (
                    <TableRow key={caseItem.id} hover>
                      <TableCell>
                        <Typography
                          component="span"
                          variant="button"
                          color="primary"
                        >
                          #{caseItem.id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {formatCaseDate(caseItem.case_date)}
                      </TableCell>
                      <TableCell>{caseItem.flight_number ?? "-"}</TableCell>
                      <TableCell>
                        {formatCaseDate(caseItem.flight_date)}
                      </TableCell>
                      <TableCell>{caseItem.passenger_name ?? "-"}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={
                            getCaseStatusPresentation(caseItem.status).label
                          }
                          color={
                            getCaseStatusPresentation(caseItem.status).color
                          }
                          sx={getCaseStatusPresentation(caseItem.status).sx}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {caseItem.assigned_colleague_name ?? "Unassigned"}
                      </TableCell>
                      <TableCell>
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

            <Stack spacing={1.5} sx={{ display: { xs: "flex", md: "none" } }}>
              {displayedCases.map((caseItem) => (
                <Card key={caseItem.id} variant="outlined">
                  <CardContent>
                    <Stack spacing={1}>
                      <Typography variant="caption" color="text.secondary">
                        <Typography
                          component="span"
                          variant="button"
                          color="primary"
                        >
                          CASE #{caseItem.id}
                        </Typography>
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        Flight {caseItem.flight_number ?? "-"}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Case date: {formatCaseDate(caseItem.case_date)}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Flight date: {formatCaseDate(caseItem.flight_date)}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Passenger: {caseItem.passenger_name ?? "-"}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Assignee:{" "}
                        {caseItem.assigned_colleague_name ?? "Unassigned"}
                      </Typography>
                      <Box>
                        <Chip
                          size="small"
                          label={
                            getCaseStatusPresentation(caseItem.status).label
                          }
                          color={
                            getCaseStatusPresentation(caseItem.status).color
                          }
                          sx={getCaseStatusPresentation(caseItem.status).sx}
                          variant="outlined"
                        />
                      </Box>
                      <Box>
                        <AssignColleagueButton
                          caseId={caseItem.id}
                          caseStatus={caseItem.status}
                          colleagues={colleagues}
                          assignedColleagueId={caseItem.assigned_colleague_id}
                          onAssigned={() => {
                            setReloadKey((current) => current + 1);
                          }}
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
  );
}

export default ColleagueCaseList;
