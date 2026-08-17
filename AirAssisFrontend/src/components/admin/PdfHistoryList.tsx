import { useEffect, useState } from "react";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import {
  Box, Card, CardContent, IconButton, MenuItem, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Tooltip, Typography,
} from "@mui/material";

import {
  downloadPdfHistoryDocument, fetchPdfHistory,
  type PdfHistoryFilters, type PdfHistoryItem,
} from "../cases/api/pdfHistoryApi";
import { CaseListEmptyState, CaseListErrorState, CaseListLoadingState } from "../cases/shared/list/CaseListStates";
import { useAppSnackbar } from "../utils/use_app_snackbar";
import { AppSnackbar } from "../utils/app_snackbar";

const DOCUMENT_TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "BOARDING_PASS", label: "Boarding Pass" },
  { value: "PASSPORT", label: "Passport" },
  { value: "CONTRACT", label: "Contract" },
];

function PdfHistoryList() {
  const [items, setItems] = useState<PdfHistoryItem[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [filters, setFilters] = useState<PdfHistoryFilters>({});
  const { snackbar, closeSnackbar, showErrorSnackbar } = useAppSnackbar();

  useEffect(() => {
    let isActive = true;

    fetchPdfHistory(filters, page + 1, rowsPerPage)
      .then((response) => {
        if (!isActive) return;
        setItems(response.data);
        setCount(response.pagination.count);
        setHasError(false);
      })
      .catch(() => {
        if (!isActive) return;
        setItems([]);
        setHasError(true);
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => { isActive = false; };
  }, [filters, page, rowsPerPage]);

  const updateFilter = (patch: Partial<PdfHistoryFilters>) => {
    setIsLoading(true);
    setPage(0);
    setFilters((current) => ({ ...current, ...patch }));
  };

  const handleDownload = async (item: PdfHistoryItem) => {
    try {
      await downloadPdfHistoryDocument(item.id, item.document_name);
    } catch {
      showErrorSnackbar("Could not download this document.");
    }
  };

  return (
    <Card elevation={1} sx={{ maxWidth: 1220, width: "100%", mx: "auto", mt: 3 }}>
      <CardContent sx={{ p: { xs: 2, md: 4 } }}>
        <AppSnackbar open={snackbar.open} message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar} />
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Typography variant="h2">PDF History</Typography>
        </Box>

        <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: "wrap" }}>
          <TextField size="small" label="Case ID" sx={{ width: 140 }}
            onChange={(e) => updateFilter({ caseId: e.target.value })} />
          <TextField size="small" label="Passenger name" sx={{ minWidth: 200 }}
            onChange={(e) => updateFilter({ passengerName: e.target.value })} />
          <TextField size="small" select label="Document type" sx={{ width: 180 }}
            defaultValue="" onChange={(e) => updateFilter({ documentType: e.target.value })}>
            {DOCUMENT_TYPE_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </TextField>
          <TextField size="small" label="From" type="date" sx={{ width: 170 }}
            slotProps={{ inputLabel: { shrink: true } }}
            onChange={(e) => updateFilter({ uploadedFrom: e.target.value })} />
          <TextField size="small" label="To" type="date" sx={{ width: 170 }}
            slotProps={{ inputLabel: { shrink: true } }}
            onChange={(e) => updateFilter({ uploadedTo: e.target.value })} />
        </Stack>

        {isLoading ? (
          <CaseListLoadingState label="Loading PDF history..." />
        ) : hasError ? (
          <CaseListErrorState message="We could not load the PDF history right now." />
        ) : items.length === 0 ? (
          <CaseListEmptyState />
        ) : (
          <>
            <TableContainer sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Document Name</TableCell>
                    <TableCell>Passenger Name</TableCell>
                    <TableCell>Case ID</TableCell>
                    <TableCell align="center">Download</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>{item.id}</TableCell>
                      <TableCell>{item.document_name}</TableCell>
                      <TableCell>{item.passenger_name ?? "-"}</TableCell>
                      <TableCell>#{item.case_id}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Download PDF">
                          <IconButton color="primary" onClick={() => handleDownload(item)}
                            aria-label={`Download document ${item.id}`}>
                            <DownloadOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={count}
              page={page}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[10, 20, 50]}
              onPageChange={(_, newPage) => { setIsLoading(true); setPage(newPage); }}
              onRowsPerPageChange={(e) => {
                setIsLoading(true);
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default PdfHistoryList;