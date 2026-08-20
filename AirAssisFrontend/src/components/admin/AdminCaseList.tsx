import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import {
  Box,
  Card,
  CardContent,
  IconButton,
  Link,
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
  TableSortLabel,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  deleteAdminCase,
  fetchAdminCases,
  type AdminCaseListItem,
} from "../cases/api";
import CaseStatusChip from "../cases/shared/list/CaseStatusChip";
import {
  CaseListEmptyState,
  CaseListErrorState,
  CaseListLoadingState,
} from "../cases/shared/list/CaseListStates";
import { formatCaseDate } from "../cases/shared/list/caseListFormatting";
import { AppSnackbar } from "../utils/app_snackbar";
import { useAppSnackbar } from "../utils/use_app_snackbar";
import DeleteCaseDialog from "./DeleteCaseDialog";
import PdfHistoryList from "./PdfHistoryList";

type SortField = "id" | "flight_date" | "status";
type SortDirection = "asc" | "desc";
type SortState = {
  field: SortField;
  direction: SortDirection;
};

type AdminCaseListProps = {
  showPdfHistory: boolean;
};

function AdminCaseList({ showPdfHistory }: AdminCaseListProps) {
  const [cases, setCases] = useState<AdminCaseListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<AdminCaseListItem | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [sort, setSort] = useState<SortState>({
    field: "id",
    direction: "desc",
  });
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [flightDateFilter, setFlightDateFilter] = useState("");
  const { snackbar, closeSnackbar, showErrorSnackbar, showSuccessSnackbar } =
    useAppSnackbar();

  useEffect(() => {
    let isActive = true;

    const loadCases = async () => {
      try {
        const caseItems = await fetchAdminCases();
        if (!isActive) return;
        setCases(caseItems);
        setHasError(false);
      } catch {
        if (!isActive) return;
        setCases([]);
        setHasError(true);
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    void loadCases();
    return () => {
      isActive = false;
    };
  }, []);

  const handleDelete = async () => {
    if (!caseToDelete) return;

    setIsDeleting(true);
    try {
      await deleteAdminCase(caseToDelete.id);
      setCases((current) =>
        current.filter((caseItem) => caseItem.id !== caseToDelete.id),
      );
      setCaseToDelete(null);
      showSuccessSnackbar("Case deleted successfully.");
    } catch (error) {
      showErrorSnackbar(
        error instanceof Error ? error.message : "Could not delete case.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const caseDetailsPath = (caseId: number) => `/admin/cases/${caseId}`;

  const filteredCases = useMemo(() => {
    return cases.filter((caseItem) => {
      const matchesStatus =
        statusFilter === "ALL" || caseItem.status === statusFilter;
      const matchesFlightDate =
        !flightDateFilter || caseItem.flight_date === flightDateFilter;

      return matchesStatus && matchesFlightDate;
    });
  }, [cases, flightDateFilter, statusFilter]);

  const sortedCases = useMemo(() => {
    return [...filteredCases].sort((firstCase, secondCase) => {
      let comparison: number;

      if (sort.field === "id") {
        comparison = firstCase.id - secondCase.id;
      } else if (sort.field === "flight_date") {
        comparison = (firstCase.flight_date ?? "").localeCompare(
          secondCase.flight_date ?? "",
        );
      } else {
        comparison = firstCase.status.localeCompare(secondCase.status);
      }

      return sort.direction === "asc" ? comparison : -comparison;
    });
  }, [filteredCases, sort]);

  const handleSort = (field: SortField) => {
    setSort((currentSort) => ({
      field,
      direction:
        currentSort.field === field && currentSort.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  return (
    <Card elevation={1} sx={{ maxWidth: 1220, width: "100%", mx: "auto" }}>
      <CardContent sx={{ p: { xs: 2, md: 4 } }}>
        <AppSnackbar
          open={snackbar.open}
          message={snackbar.message}
          severity={snackbar.severity}
          onClose={closeSnackbar}
        />
        {!showPdfHistory && (
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Typography variant="h2">All Cases</Typography>
          </Box>
        )}
        {!showPdfHistory && (
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
            <FormControl
              size="small"
              sx={{ width: { xs: "100%", sm: 180 }, flexShrink: 0 }}
            >
              <InputLabel id="admin-case-status-filter-label">
                Status
              </InputLabel>
              <Select
                labelId="admin-case-status-filter-label"
                label="Status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <MenuItem value="ALL">All</MenuItem>
                <MenuItem value="ELIGIBLE">Eligible</MenuItem>
                <MenuItem value="AWAITING_DOCUMENTS">
                  Awaiting documents
                </MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="IN_REVIEW">In review</MenuItem>
                <MenuItem value="NON_ELIGIBLE">Non eligible</MenuItem>
              </Select>
            </FormControl>
            <TextField
              size="small"
              label="Flight date"
              type="date"
              value={flightDateFilter}
              onChange={(event) => setFlightDateFilter(event.target.value)}
              slotProps={{
                inputLabel: { shrink: true },
              }}
              sx={{ width: { xs: "100%", sm: 220 }, flexShrink: 0 }}
            />
          </Stack>
        )}
        {showPdfHistory ? (
          <PdfHistoryList />
        ) : isLoading ? (
          <CaseListLoadingState label="Loading cases..." />
        ) : hasError ? (
          <CaseListErrorState message="We could not load the case list right now." />
        ) : filteredCases.length === 0 ? (
          <CaseListEmptyState />
        ) : (
          <Box
            sx={{ maxHeight: { xs: 520, md: 640 }, overflowY: "auto", px: 1 }}
          >
            <TableContainer
              sx={{
                display: { xs: "none", md: "block" },
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
              }}
            >
              <Table stickyHeader>
                <TableHead
                  sx={{
                    "& .MuiTableCell-head": {
                      fontSize: "20px",
                      textAlign: "center",
                    },
                    "& .MuiTableSortLabel-root": {
                      fontSize: "20px",
                      justifyContent: "center",
                      width: "100%",
                    },
                  }}
                >
                  <TableRow>
                    <TableCell
                      sortDirection={
                        sort.field === "id" ? sort.direction : false
                      }
                    >
                      <TableSortLabel
                        active={sort.field === "id"}
                        direction={sort.field === "id" ? sort.direction : "asc"}
                        onClick={() => handleSort("id")}
                      >
                        Case ID
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Case Date</TableCell>
                    <TableCell>Flight Number</TableCell>
                    <TableCell
                      sortDirection={
                        sort.field === "flight_date" ? sort.direction : false
                      }
                    >
                      <TableSortLabel
                        active={sort.field === "flight_date"}
                        direction={
                          sort.field === "flight_date" ? sort.direction : "asc"
                        }
                        onClick={() => handleSort("flight_date")}
                      >
                        Flight Date
                      </TableSortLabel>
                    </TableCell>
                    <TableCell
                      sortDirection={
                        sort.field === "status" ? sort.direction : false
                      }
                    >
                      <TableSortLabel
                        active={sort.field === "status"}
                        direction={
                          sort.field === "status" ? sort.direction : "asc"
                        }
                        onClick={() => handleSort("status")}
                      >
                        Status
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody
                  sx={{
                    "& .MuiTableCell-body": {
                      fontSize: "14px",
                      textAlign: "center",
                    },
                    "& .MuiChip-root": {
                      fontSize: "16px",
                    },
                  }}
                >
                  {sortedCases.map((caseItem) => (
                    <TableRow key={caseItem.id} hover>
                      <TableCell>
                        <Link
                          component={RouterLink}
                          to={caseDetailsPath(caseItem.id)}
                          underline="hover"
                          aria-label={`Open case ${caseItem.id}`}
                        >
                          #{caseItem.id}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {formatCaseDate(caseItem.case_date)}
                      </TableCell>
                      <TableCell>{caseItem.flight_number ?? "-"}</TableCell>
                      <TableCell>
                        {formatCaseDate(caseItem.flight_date)}
                      </TableCell>
                      <TableCell>
                        <CaseStatusChip status={caseItem.status} />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Delete case">
                          <span>
                            <IconButton
                              color="error"
                              onClick={() => setCaseToDelete(caseItem)}
                              disabled={isDeleting}
                              aria-label={`Delete case ${caseItem.id}`}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Stack spacing={1.5} sx={{ display: { xs: "flex", md: "none" } }}>
              {sortedCases.map((caseItem) => (
                <Card key={caseItem.id} variant="outlined">
                  <CardContent>
                    <Stack spacing={1}>
                      <Link
                        component={RouterLink}
                        to={caseDetailsPath(caseItem.id)}
                      >
                        CASE #{caseItem.id}
                      </Link>
                      <Typography>
                        Case date: {formatCaseDate(caseItem.case_date)}
                      </Typography>
                      <Typography>
                        Flight: {caseItem.flight_number ?? "-"}
                      </Typography>
                      <Typography>
                        Flight date: {formatCaseDate(caseItem.flight_date)}
                      </Typography>
                      <Box>
                        <CaseStatusChip status={caseItem.status} />
                      </Box>
                      <Box>
                        <Tooltip title="Delete case">
                          <span>
                            <IconButton
                              color="error"
                              onClick={() => setCaseToDelete(caseItem)}
                              disabled={isDeleting}
                              aria-label={`Delete case ${caseItem.id}`}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Box>
        )}
        <DeleteCaseDialog
          caseItem={caseToDelete}
          isDeleting={isDeleting}
          onCancel={() => {
            if (!isDeleting) setCaseToDelete(null);
          }}
          onConfirm={() => void handleDelete()}
        />
      </CardContent>
    </Card>
  );
}

export default AdminCaseList;
