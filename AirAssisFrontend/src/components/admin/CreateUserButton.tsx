import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { PersonAdd as PersonAddIcon } from "@mui/icons-material";
import { fetchWithAuth } from "../../utils/auth";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

const ROLES = ["COLLEAGUE", "PASSENGER"] as const;
type Role = (typeof ROLES)[number];

interface FormState {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  role: Role;
}

const EMPTY_FORM: FormState = {
  firstname: "",
  lastname: "",
  email: "",
  password: "",
  role: "COLLEAGUE",
};

interface CreateUserButtonProps {
  onUserCreated: () => void;
}

// Handles DRF field-error dicts {"email": ["already exists"]} and plain message/detail
function extractApiError(data: unknown, status: number): string {
  if (!data || typeof data !== "object")
    return `Error ${status}: Could not create user.`;
  const d = data as Record<string, unknown>;
  if (typeof d.message === "string") return d.message;
  if (typeof d.detail === "string") return d.detail;
  const firstKey = Object.keys(d)[0];
  if (firstKey) {
    const val = d[firstKey];
    const msg = Array.isArray(val) ? String(val[0]) : String(val);
    return `${firstKey}: ${msg}`;
  }
  return `Error ${status}: Could not create user.`;
}

export default function CreateUserButton({
  onUserCreated,
}: CreateUserButtonProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleOpen = () => {
    setForm(EMPTY_FORM);
    setError(null);
    setSuccess(false);
    setOpen(true);
  };

  const handleClose = () => {
    if (!submitting) setOpen(false);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/user/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(extractApiError(data, res.status));
      setSuccess(true);
      onUserCreated();
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<PersonAddIcon />}
        onClick={handleOpen}
      >
        Create User
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Typography variant="h2" component="span">
            Create User
          </Typography>
        </DialogTitle>

        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {error && <Alert severity="error">{error}</Alert>}
              {success && (
                <Alert severity="success">User created successfully.</Alert>
              )}

              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  label="First Name"
                  name="firstname"
                  value={form.firstname}
                  onChange={handleChange}
                  required
                  fullWidth
                  autoFocus
                  disabled={submitting || success}
                />
                <TextField
                  label="Last Name"
                  name="lastname"
                  value={form.lastname}
                  onChange={handleChange}
                  required
                  fullWidth
                  disabled={submitting || success}
                />
              </Box>

              <TextField
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                fullWidth
                disabled={submitting || success}
              />

              <TextField
                label="Password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                fullWidth
                disabled={submitting || success}
                helperText="The user will be prompted to change this on first login."
              />

              <TextField
                select
                label="Role"
                name="role"
                value={form.role}
                onChange={handleChange}
                required
                fullWidth
                disabled={submitting || success}
              >
                {ROLES.map((r) => (
                  <MenuItem key={r} value={r}>
                    {r.charAt(0) + r.slice(1).toLowerCase()}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting || success}
              startIcon={
                submitting ? (
                  <CircularProgress size={16} color="inherit" />
                ) : undefined
              }
            >
              {submitting ? "Creating…" : "Create"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
