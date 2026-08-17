import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Link,
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
import { useEffect } from "react";

function AdminCaseList() {
  const [cases, setCases] = useState<AdminCaseListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<AdminCaseListItem | null>(
    null,
  );
  const [showPdfHistory, setShowPdfHistory] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

  return (
    <Card elevation={1} sx={{ maxWidth: 1220, width: "100%", mx: "auto" }}>
      <CardContent sx={{ p: { xs: 2, md: 4 } }}>
        <AppSnackbar
          open={snackbar.open}
          message={snackbar.message}
          severity={snackbar.severity}
          onClose={closeSnackbar}
        />
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Typography variant="h2">All Cases</Typography>
          <Button
            variant="outlined"
            startIcon={<PictureAsPdfOutlinedIcon fontSize="small" />}
            onClick={() => setShowPdfHistory((current) => !current)}
            sx={{ mt: 1.5 }}
          >
            {showPdfHistory ? "Back to Case List" : "PDF History"}
          </Button>
        </Box>

        {showPdfHistory ? (
          <PdfHistoryList />
        ) : isLoading ? (
          <CaseListLoadingState label="Loading cases..." />
        ) : hasError ? (
          <CaseListErrorState message="We could not load the case list right now." />
        ) : cases.length === 0 ? (
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
                <TableHead>
                  <TableRow>
                    <TableCell>Case ID</TableCell>
                    <TableCell>Case Date</TableCell>
                    <TableCell>Flight Number</TableCell>
                    <TableCell>Flight Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cases.map((caseItem) => (
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
              {cases.map((caseItem) => (
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