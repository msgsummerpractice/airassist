import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  InfoOutlined as InfoIcon,
  DeleteOutline as DeleteOutlineIcon,
  PersonSearch as PersonSearchIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { fetchWithAuth } from "../../utils/auth";
import CreateUserButton from "./CreateUserButton";
import { AppSnackbar } from "../utils/app_snackbar";
import { useAppSnackbar } from "../utils/use_app_snackbar";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

interface UserEntry {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
  assigned_case_count: number;
}

function roleChipColor(role: string): "primary" | "secondary" | "default" {
  if (role === "COLLEAGUE") return "primary";
  if (role === "PASSENGER") return "secondary";
  return "default";
}

function extractApiError(data: unknown, status: number): string {
  if (!data || typeof data !== "object") {
    return `Error ${status}: Could not delete user.`;
  }

  const record = data as Record<string, unknown>;
  if (typeof record.message === "string") return record.message;
  if (typeof record.detail === "string") return record.detail;

  const firstKey = Object.keys(record)[0];
  if (firstKey) {
    const value = record[firstKey];
    const text = Array.isArray(value) ? String(value[0]) : String(value);
    return `${firstKey}: ${text}`;
  }

  return `Error ${status}: Could not delete user.`;
}

function AdminUsersPage() {
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserEntry | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

  const { snackbar, closeSnackbar, showSuccessSnackbar, showErrorSnackbar } =
    useAppSnackbar();

  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [minCasesFilter, setMinCasesFilter] = useState("");

  const [detailUser, setDetailUser] = useState<UserEntry | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const minCases = parseInt(minCasesFilter, 10);

  const matchesFilters = (u: UserEntry) => {
    const fullName = `${u.firstname} ${u.lastname}`.toLowerCase();
    return (
      fullName.includes(nameFilter.toLowerCase()) &&
      u.email.toLowerCase().includes(emailFilter.toLowerCase()) &&
      (isNaN(minCases) || u.assigned_case_count >= minCases)
    );
  };

  const loadUsers = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/user/`);
      if (!res.ok) throw new Error(`Could not load users (${res.status}).`);
      const body = await res.json();
      setUsers(Array.isArray(body) ? body : (body.data ?? []));
      setLoaded(true);
      setPage(0);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  };

  const filtered = users.filter(matchesFilters);

  const openDeleteDialog = (user: UserEntry) => {
    setDeleteUser(user);
  };

  const closeDeleteDialog = () => {
    if (deletingUserId === null) {
      setDeleteUser(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteUser) return;

    const targetId = deleteUser.id;
    setDeletingUserId(targetId);

    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/user/${targetId}/`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(extractApiError(data, res.status));
      }

      const nextUsers = users.filter((u) => u.id !== targetId);
      setUsers(nextUsers);

      if (detailUser?.id === targetId) {
        setDetailUser(null);
      }

      const nextFilteredCount = nextUsers.filter(matchesFilters).length;
      const maxPage = Math.max(
        0,
        Math.ceil(nextFilteredCount / rowsPerPage) - 1,
      );
      setPage((current) => Math.min(current, maxPage));

      setDeleteUser(null);
      showSuccessSnackbar("User account deleted successfully.");
    } catch (err) {
      showErrorSnackbar(
        err instanceof Error ? err.message : "Could not delete user.",
      );
    } finally {
      setDeletingUserId(null);
    }
  };

  const paginated = filtered.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", px: { xs: 2, md: 4 }, py: 4 }}>
      <AppSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
      <Typography variant="h2" sx={{ mb: 0.5 }}>
        User Management
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 3, fontSize: "0.875rem" }}
      >
        Colleagues and passengers registered in the system.
      </Typography>

      <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={
            loading ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <RefreshIcon />
            )
          }
          onClick={loadUsers}
          disabled={loading}
        >
          {loaded ? "Reload Users" : "Load Users"}
        </Button>
        <CreateUserButton onUserCreated={loadUsers} />
      </Box>

      {loadError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
      )}

      {loaded && (
        <>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 1.5 }}>
            <TextField
              size="small"
              label="Search by name"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              sx={{ minWidth: 200 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonSearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              size="small"
              label="Search by email"
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              sx={{ minWidth: 220 }}
            />
            <TextField
              size="small"
              label="Min. assigned cases"
              type="number"
              value={minCasesFilter}
              onChange={(e) => setMinCasesFilter(e.target.value)}
              slotProps={{ htmlInput: { min: 0 } }}
              sx={{ width: 170 }}
            />
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 1 }}
          >
            {filtered.length} user{filtered.length !== 1 ? "s" : ""} shown
          </Typography>

          <TableContainer component={Paper} elevation={1}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "background.default" }}>
                  {["Name", "Email", "Role", "Assigned Cases", "Actions"].map(
                    (h) => (
                      <TableCell
                        key={h}
                        align={
                          h === "Assigned Cases" || h === "Actions"
                            ? "center"
                            : "left"
                        }
                      >
                        <Typography variant="caption">{h}</Typography>
                      </TableCell>
                    ),
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ py: 2 }}
                      >
                        No users match the current filters.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {user.firstname} {user.lastname}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" color="text.secondary">
                          {user.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.role}
                          color={roleChipColor(user.role)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 500,
                            color:
                              user.assigned_case_count > 0
                                ? "primary.main"
                                : "text.secondary",
                          }}
                        >
                          {user.assigned_case_count}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View details">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => setDetailUser(user)}
                          >
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete user">
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => openDeleteDialog(user)}
                              disabled={deletingUserId === user.id}
                              sx={{ ml: 0.5 }}
                            >
                              {deletingUserId === user.id ? (
                                <CircularProgress size={16} color="inherit" />
                              ) : (
                                <DeleteOutlineIcon fontSize="small" />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </>
      )}

      {/* View Details Modal */}
      <Dialog
        open={!!detailUser}
        onClose={() => setDetailUser(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>User Details</DialogTitle>
        <DialogContent dividers>
          {detailUser && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "120px 1fr",
                gap: 1.5,
                alignItems: "start",
              }}
            >
              <Typography variant="caption" color="text.secondary">
                ID
              </Typography>
              <Typography variant="body1">{detailUser.id}</Typography>

              <Typography variant="caption" color="text.secondary">
                First Name
              </Typography>
              <Typography variant="body1">{detailUser.firstname}</Typography>

              <Typography variant="caption" color="text.secondary">
                Last Name
              </Typography>
              <Typography variant="body1">{detailUser.lastname}</Typography>

              <Typography variant="caption" color="text.secondary">
                Email
              </Typography>
              <Typography variant="body1">{detailUser.email}</Typography>

              <Typography variant="caption" color="text.secondary">
                Role
              </Typography>
              <Chip
                label={detailUser.role}
                color={roleChipColor(detailUser.role)}
                size="small"
                variant="outlined"
              />

              <Typography variant="caption" color="text.secondary">
                Assigned Cases
              </Typography>
              <Typography variant="body1">
                {detailUser.assigned_case_count}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailUser(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!deleteUser}
        onClose={closeDeleteDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h2" component="span">
            Delete User
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {deleteUser && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
              <Typography variant="body1">
                Are you sure you want to delete this user account?
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {deleteUser.firstname} {deleteUser.lastname}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {deleteUser.email}
              </Typography>
              <Chip
                label={deleteUser.role}
                color={roleChipColor(deleteUser.role)}
                size="small"
                variant="outlined"
                sx={{ alignSelf: "flex-start" }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={closeDeleteDialog}
            disabled={deletingUserId !== null}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmDelete}
            disabled={deletingUserId !== null}
            startIcon={
              deletingUserId !== null ? (
                <CircularProgress size={16} color="inherit" />
              ) : undefined
            }
          >
            {deletingUserId !== null ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminUsersPage;
