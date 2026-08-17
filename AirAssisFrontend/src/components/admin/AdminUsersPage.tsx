import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Stack,
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
  Toolbar,
} from "@mui/material";
import {
  InfoOutlined as InfoIcon,
  DeleteOutlined as DeleteOutlineIcon,
  PersonSearch as PersonSearchIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import {
  clearStoredUserIdentity,
  fetchWithAuth,
  getStoredUserIdentity,
} from "../../utils/auth";
import { useNavigate } from "react-router-dom";
import PortalUserHeader from "../portal/PortalUserHeader";
import CreateUserButton from "./CreateUserButton";
import { AppSnackbar } from "../utils/app_snackbar";
import { useAppSnackbar } from "../utils/use_app_snackbar";
import {
  GroupOutlined as GroupIcon,
  FolderOutlined as FolderIcon,
  SettingsOutlined as SettingsIcon,
  LogoutOutlined as LogoutOutlinedIcon,
  SettingsOutlined as SettingsIcon,
} from "@mui/icons-material";

const USER_DELETE_SUCCESS_HIDE_MS = 15000;

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
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserEntry | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const currentUser = getStoredUserIdentity();

  const handleLogout = () => {
    localStorage.removeItem("airassist_access_token");
    localStorage.removeItem("airassist_refresh_token");
    clearStoredUserIdentity();
    window.location.assign("/login");
  };

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
          onClick: handleLogout,
        }}
        actions={[
          {
            label: "User View",
            icon: <GroupIcon fontSize="small" />,
            active: true,
            onClick: () => navigate("/admin/users"),
          },
          {
            label: "Case View",
            icon: <FolderIcon fontSize="small" />,
            onClick: () => navigate("/admin/cases"),
          },
          {
            label: "System View",
            icon: <SettingsIcon fontSize="small" />,
            onClick: () => navigate("/admin/system-options"),
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
          <AppSnackbar
            open={snackbar.open}
            message={snackbar.message}
            severity={snackbar.severity}
            autoHideDuration={
              snackbar.severity === "success" &&
              snackbar.message === "User account deleted succesfully."
                ? USER_DELETE_SUCCESS_HIDE_MS
                : undefined
            }
            onClose={closeSnackbar}
          />

          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Typography variant="h2">User Management</Typography>
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{
              mb: 3,
              justifyContent: "center",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
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
          </Stack>

          {loadError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {loadError}
            </Alert>
          )}

          <Toolbar></Toolbar>

          {loaded && (
            <>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                sx={{
                  mb: 1.5,
                  width: "100%",
                  justifyContent: "center",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <TextField
                  size="small"
                  label="Search by name"
                  value={nameFilter}
                  onChange={(event) => setNameFilter(event.target.value)}
                  sx={{ minWidth: 180, flex: "1 1 180px" }}
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
                  onChange={(event) => setEmailFilter(event.target.value)}
                  sx={{ minWidth: 220, flex: "1 1 220px" }}
                />

                <TextField
                  size="small"
                  label="Min. assigned cases"
                  type="number"
                  value={minCasesFilter}
                  onChange={(event) => setMinCasesFilter(event.target.value)}
                  slotProps={{ htmlInput: { min: 0 } }}
                  sx={{ minWidth: 170, flex: "1 1 170px" }}
                />
              </Stack>

              <Box
                sx={{
                  maxHeight: { xs: 520, md: 640 },
                  overflowY: "auto",
                  px: 1,
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
                        {[
                          "Name",
                          "Email",
                          "Role",
                          "Assigned Cases",
                          "Actions",
                        ].map((heading) => (
                          <TableCell
                            key={heading}
                            align={
                              heading === "Assigned Cases" ||
                              heading === "Actions"
                                ? "center"
                                : "left"
                            }
                          >
                            {heading}
                          </TableCell>
                        ))}
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
                              {user.firstname} {user.lastname}
                            </TableCell>

                            <TableCell>{user.email}</TableCell>

                            <TableCell>
                              <Chip
                                label={user.role}
                                color={roleChipColor(user.role)}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>

                            <TableCell align="center">
                              <Box
                                component="span"
                                sx={{
                                  color:
                                    user.assigned_case_count > 0
                                      ? "primary.main"
                                      : "text.secondary",
                                }}
                              >
                                {user.assigned_case_count}
                              </Box>
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
                                      <CircularProgress
                                        size={16}
                                        color="inherit"
                                      />
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
              </Box>

              <TablePagination
                component="div"
                count={filtered.length}
                page={page}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[5, 10, 25]}
                onPageChange={(_, newPage) => setPage(newPage)}
                onRowsPerPageChange={(event) => {
                  setRowsPerPage(parseInt(event.target.value, 10));
                  setPage(0);
                }}
              />
            </>
          )}

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
                  <Typography variant="body1">
                    {detailUser.firstname}
                  </Typography>

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
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}
                >
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
        </CardContent>
      </Card>
    </Box>
  );
}

export default AdminUsersPage;
