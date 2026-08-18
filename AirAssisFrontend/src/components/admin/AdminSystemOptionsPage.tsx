import { useEffect, useState } from "react";
import {
  ArrowBackOutlined as ArrowBackIcon,
  CheckBoxOutlineBlankOutlined as UncheckedIcon,
  CheckBoxOutlined as CheckedIcon,
  DescriptionOutlined as DescriptionIcon,
  FolderOutlined as FolderIcon,
  GroupOutlined as GroupIcon,
  LogoutOutlined as LogoutOutlinedIcon,
  MailOutlineOutlined as MailIcon,
  SaveOutlined as SaveIcon,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { Navigate, useNavigate } from "react-router-dom";
import { SettingsOutlined as SettingsIcon } from "@mui/icons-material";

import {
  getStoredUserIdentity,
  logoutToGuestCaseEntry,
} from "../../utils/auth";
import PortalUserHeader from "../portal/PortalUserHeader";
import { AppSnackbar } from "../utils/app_snackbar";
import { useAppSnackbar } from "../utils/use_app_snackbar";
import {
  fetchSystemOptions,
  saveSystemOptions,
  type EmailPreset,
  type PdfField,
  type PdfPreset,
  type SystemOptions,
} from "./systemOptionsApi";

const ACCESS_TOKEN_STORAGE_KEY = "airassist_access_token";

const EMAIL_PLACEHOLDERS = [
  "{{case_number}}",
  "{{passenger_name}}",
  "{{flight_number}}",
  "{{organisation_name}}",
  "{{departure_airport}}",
  "{{arrival_airport}}",
] as const;

const PDF_FIELD_OPTIONS: Array<{ value: PdfField; label: string }> = [
  { value: "case_number", label: "Case number" },
  { value: "passenger_name", label: "Passenger name" },
  { value: "passenger_email", label: "Passenger email" },
  { value: "flight_number", label: "Flight number" },
  { value: "route", label: "Route" },
  { value: "departure_date", label: "Departure date" },
  { value: "delay_minutes", label: "Delay length" },
  { value: "claim_status", label: "Claim status" },
  { value: "assigned_colleague", label: "Assigned colleague" },
  { value: "disruption_type", label: "Disruption type" },
];

type ValidationErrors = {
  sender_email?: string;
  smtp_host?: string;
  smtp_port?: string;
  smtp_username?: string;
  exported_fields?: string;
};

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateSettings(settings: SystemOptions): ValidationErrors {
  const errors: ValidationErrors = {};
  const emailPreset = settings.email_preset;
  const pdfPreset = settings.pdf_preset;

  if (!isValidEmail(emailPreset.sender_email)) {
    errors.sender_email = "Enter a valid sender email address.";
  }

  if (emailPreset.delivery_mode === "SMTP") {
    if (!emailPreset.smtp_host.trim()) {
      errors.smtp_host = "SMTP host is required for SMTP delivery.";
    }
    if (!emailPreset.smtp_port || emailPreset.smtp_port < 1) {
      errors.smtp_port = "Enter a valid SMTP port.";
    }
    if (!emailPreset.smtp_username.trim()) {
      errors.smtp_username = "SMTP username is required for SMTP delivery.";
    }
  }

  if (pdfPreset.exported_fields.length === 0) {
    errors.exported_fields = "Select at least one PDF field to export.";
  }

  return errors;
}

function AdminSystemOptionsPage() {
  const navigate = useNavigate();
  const currentUser = getStoredUserIdentity();
  const [isAuthenticated] = useState(() =>
    Boolean(localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)),
  );
  const [settings, setSettings] = useState<SystemOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const { snackbar, closeSnackbar, showErrorSnackbar, showSuccessSnackbar } =
    useAppSnackbar();

  useEffect(() => {
    let active = true;

    const loadSettings = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await fetchSystemOptions();
        if (!active) return;
        setSettings(data);
      } catch (error) {
        if (!active) return;
        setLoadError(
          error instanceof Error ? error.message : "Could not load system options.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadSettings();

    return () => {
      active = false;
    };
  }, []);

  const handleLogout = () => {
    logoutToGuestCaseEntry();
  };

  const updateEmailPreset = <K extends keyof EmailPreset>(
    key: K,
    value: EmailPreset[K],
  ) => {
    setSettings((current) =>
      current
        ? {
            ...current,
            email_preset: {
              ...current.email_preset,
              [key]: value,
            },
          }
        : current,
    );
  };

  const updatePdfPreset = <K extends keyof PdfPreset>(
    key: K,
    value: PdfPreset[K],
  ) => {
    setSettings((current) =>
      current
        ? {
            ...current,
            pdf_preset: {
              ...current.pdf_preset,
              [key]: value,
            },
          }
        : current,
    );
  };

  const handlePdfFieldToggle = (field: PdfField) => {
    setSettings((current) => {
      if (!current) return current;
      const exists = current.pdf_preset.exported_fields.includes(field);
      return {
        ...current,
        pdf_preset: {
          ...current.pdf_preset,
          exported_fields: exists
            ? current.pdf_preset.exported_fields.filter((item) => item !== field)
            : [...current.pdf_preset.exported_fields, field],
        },
      };
    });
  };

  const handleSave = async () => {
    if (!settings) return;

    const nextErrors = validateSettings(settings);
    setValidationErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      showErrorSnackbar("Fix the highlighted fields before saving.");
      return;
    }

    setSaving(true);
    try {
      const response = await saveSystemOptions(settings);
      setSettings(response.data ?? settings);
      showSuccessSnackbar(response.message ?? "System options saved successfully.");
    } catch (error) {
      showErrorSnackbar(
        error instanceof Error ? error.message : "Could not save system options.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, rgba(0, 49, 120, 0.06) 0%, rgba(248, 249, 255, 1) 16%, rgba(248, 249, 255, 1) 100%)",
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
            onClick: () => navigate("/admin/users"),
          },
          {
            label: "Case View",
            icon: <FolderIcon fontSize="small" />,
            onClick: () => navigate("/admin/cases"),
          },
          {
            label: "System Options",
            active: true,
            icon: <SettingsIcon fontSize="small" />,
            onClick: () => navigate("/admin/system-options"),
          },
        ]}
      />

      <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2, md: 4 }, py: 4 }}>
        <AppSnackbar
          open={snackbar.open}
          message={snackbar.message}
          severity={snackbar.severity}
          onClose={closeSnackbar}
        />

        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={2}
          sx={{ alignItems: { xs: "flex-start", lg: "center" }, mb: 3 }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="h2" sx={{ mb: 0.75 }}>
              System Options
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Configure outgoing email behaviour and the PDF export preset used by the organisation.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/admin/users")}
          >
            Back
          </Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress color="inherit" size={18} /> : <SaveIcon />}
            onClick={handleSave}
            disabled={loading || saving || !settings}
          >
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </Stack>

        {loadError ? (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => window.location.reload()}>
                Retry
              </Button>
            }
            sx={{ mb: 3 }}
          >
            {loadError}
          </Alert>
        ) : null}

        {loading || !settings ? (
          <Box sx={{ display: "grid", placeItems: "center", py: 10 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={3}>
            <Card elevation={1}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Stack spacing={3}>
                  <Stack spacing={1}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                      <MailIcon color="primary" />
                      <Typography variant="h2" sx={{ fontSize: "1.35rem" }}>
                        Email Preset
                      </Typography>
                    </Stack>
                    <Typography variant="body1" color="text.secondary">
                      Choose the delivery channel, SMTP account details, and
                      the default templates used by outbound updates.
                    </Typography>
                  </Stack>

                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <FormControl fullWidth>
                      <InputLabel id="delivery-mode-label">Delivery mode</InputLabel>
                      <Select
                        labelId="delivery-mode-label"
                        value={settings.email_preset.delivery_mode}
                        label="Delivery mode"
                        onChange={(event) =>
                          updateEmailPreset(
                            "delivery_mode",
                            event.target.value as EmailPreset["delivery_mode"],
                          )
                        }
                      >
                        <MenuItem value="SMTP">SMTP</MenuItem>
                        <MenuItem value="SENDGRID_API">SendGrid API</MenuItem>
                        <MenuItem value="MICROSOFT_GRAPH">Microsoft Graph</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      fullWidth
                      label="Sender name"
                      value={settings.email_preset.sender_name}
                      onChange={(event) => updateEmailPreset("sender_name", event.target.value)}
                    />
                  </Stack>

                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField
                      fullWidth
                      label="Sender email"
                      value={settings.email_preset.sender_email}
                      onChange={(event) => updateEmailPreset("sender_email", event.target.value)}
                      error={Boolean(validationErrors.sender_email)}
                      helperText={validationErrors.sender_email}
                    />
                    <TextField
                      fullWidth
                      label="Reply-to email"
                      value={settings.email_preset.reply_to_email}
                      onChange={(event) => updateEmailPreset("reply_to_email", event.target.value)}
                    />
                  </Stack>

                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField
                      fullWidth
                      label="SMTP host"
                      value={settings.email_preset.smtp_host}
                      onChange={(event) => updateEmailPreset("smtp_host", event.target.value)}
                      error={Boolean(validationErrors.smtp_host)}
                      helperText={validationErrors.smtp_host}
                    />
                    <TextField
                      fullWidth
                      label="SMTP port"
                      type="number"
                      value={settings.email_preset.smtp_port ?? ""}
                      onChange={(event) =>
                        updateEmailPreset(
                          "smtp_port",
                          event.target.value ? Number(event.target.value) : undefined,
                        )
                      }
                      error={Boolean(validationErrors.smtp_port)}
                      helperText={validationErrors.smtp_port}
                    />
                    <TextField
                      fullWidth
                      label="SMTP username"
                      value={settings.email_preset.smtp_username}
                      onChange={(event) => updateEmailPreset("smtp_username", event.target.value)}
                      error={Boolean(validationErrors.smtp_username)}
                      helperText={validationErrors.smtp_username}
                    />
                  </Stack>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.email_preset.use_tls}
                        onChange={(event) => updateEmailPreset("use_tls", event.target.checked)}
                      />
                    }
                    label="Require TLS when connecting to the delivery service"
                  />

                  <TextField
                    fullWidth
                    label="Subject template"
                    value={settings.email_preset.subject_template}
                    onChange={(event) => updateEmailPreset("subject_template", event.target.value)}
                  />
                  <TextField
                    fullWidth
                    multiline
                    minRows={6}
                    label="Body template"
                    value={settings.email_preset.body_template}
                    onChange={(event) => updateEmailPreset("body_template", event.target.value)}
                  />
                  <TextField
                    fullWidth
                    label="Footer text"
                    value={settings.email_preset.footer_text}
                    onChange={(event) => updateEmailPreset("footer_text", event.target.value)}
                  />

                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                      Supported placeholders
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      useFlexGap
                      sx={{ flexWrap: "wrap" }}
                    >
                      {EMAIL_PLACEHOLDERS.map((placeholder) => (
                        <Chip key={placeholder} label={placeholder} variant="outlined" />
                      ))}
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card elevation={1}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Stack spacing={3}>
                  <Stack spacing={1}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                      <DescriptionIcon color="primary" />
                      <Typography variant="h2" sx={{ fontSize: "1.35rem" }}>
                        PDF Preset
                      </Typography>
                    </Stack>
                    <Typography variant="body1" color="text.secondary">
                      Control the export layout and choose which case details should appear in generated PDFs.
                    </Typography>
                  </Stack>

                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <FormControl fullWidth>
                      <InputLabel id="pdf-layout-label">Layout</InputLabel>
                      <Select
                        labelId="pdf-layout-label"
                        value={settings.pdf_preset.layout}
                        label="Layout"
                        onChange={(event) =>
                          updatePdfPreset("layout", event.target.value as PdfPreset["layout"])
                        }
                      >
                        <MenuItem value="STANDARD">Standard</MenuItem>
                        <MenuItem value="COMPACT">Compact</MenuItem>
                        <MenuItem value="DETAILED">Detailed</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl fullWidth>
                      <InputLabel id="page-size-label">Page size</InputLabel>
                      <Select
                        labelId="page-size-label"
                        value={settings.pdf_preset.page_size}
                        label="Page size"
                        onChange={(event) =>
                          updatePdfPreset("page_size", event.target.value as PdfPreset["page_size"])
                        }
                      >
                        <MenuItem value="A4">A4</MenuItem>
                        <MenuItem value="LETTER">Letter</MenuItem>
                      </Select>
                    </FormControl>
                  </Stack>

                  <FormGroup>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.pdf_preset.include_branding}
                            onChange={(event) => updatePdfPreset("include_branding", event.target.checked)}
                          />
                        }
                        label="Include branding"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.pdf_preset.include_disruption_summary}
                            onChange={(event) =>
                              updatePdfPreset("include_disruption_summary", event.target.checked)
                            }
                          />
                        }
                        label="Include disruption summary"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.pdf_preset.include_passenger_contact}
                            onChange={(event) =>
                              updatePdfPreset("include_passenger_contact", event.target.checked)
                            }
                          />
                        }
                        label="Include passenger contact"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.pdf_preset.include_case_timeline}
                            onChange={(event) =>
                              updatePdfPreset("include_case_timeline", event.target.checked)
                            }
                          />
                        }
                        label="Include case timeline"
                      />
                    </Stack>
                  </FormGroup>

                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                      Exported fields
                    </Typography>
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={{ xs: 0.5, md: 2 }}
                      useFlexGap
                      sx={{ flexWrap: "wrap" }}
                    >
                      {PDF_FIELD_OPTIONS.map((field) => {
                        const checked = settings.pdf_preset.exported_fields.includes(field.value);
                        return (
                          <FormControlLabel
                            key={field.value}
                            control={
                              <Checkbox
                                checked={checked}
                                icon={<UncheckedIcon />}
                                checkedIcon={<CheckedIcon />}
                                onChange={() => handlePdfFieldToggle(field.value)}
                              />
                            }
                            label={field.label}
                          />
                        );
                      })}
                    </Stack>
                    {validationErrors.exported_fields ? (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
                        {validationErrors.exported_fields}
                      </Typography>
                    ) : null}
                  </Box>

                  <TextField
                    fullWidth
                    label="Footer text"
                    value={settings.pdf_preset.footer_text}
                    onChange={(event) => updatePdfPreset("footer_text", event.target.value)}
                  />
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        )}
      </Box>
    </Box>
  );
}

export default AdminSystemOptionsPage;
