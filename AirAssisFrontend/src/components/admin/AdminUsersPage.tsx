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
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  InfoOutlined as InfoIcon,
  PersonSearch as PersonSearchIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { getStoredAccessToken } from "../../utils/auth";

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

function AdminUsersPage() {
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [minCasesFilter, setMinCasesFilter] = useState("");

  const [detailUser, setDetailUser] = useState<UserEntry | null>(null);

  const authHeader = () => ({
    Authorization: `Bearer ${getStoredAccessToken() ?? ""}`,
  });

  const loadUsers = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/user/`, {
        headers: authHeader(),
      });
      if (!res.ok) throw new Error(`Could not load users (${res.status}).`);
      const body = await res.json();
      setUsers(Array.isArray(body) ? body : (body.data ?? []));
      setLoaded(true);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  };

  const minCases = parseInt(minCasesFilter, 10);
  const filtered = users.filter((u) => {
    const fullName = `${u.firstname} ${u.lastname}`.toLowerCase();
    return (
      fullName.includes(nameFilter.toLowerCase()) &&
      u.email.toLowerCase().includes(emailFilter.toLowerCase()) &&
      (isNaN(minCases) || u.assigned_case_count >= minCases)
    );
  });

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", px: { xs: 2, md: 4 }, py: 4 }}>
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

      <Button
        variant="contained"
        startIcon={
          loading ? (
            <CircularProgress size={16} color="inherit" />
          ) : (
            <RefreshIcon />
          )
        }
        onClick={loadUsers}
        disabled={loading}
        sx={{ mb: 3 }}
      >
        {loaded ? "Reload Users" : "Load Users"}
      </Button>

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
                  filtered.map((user) => (
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
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
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
    </Box>
  );
}

export default AdminUsersPage;
