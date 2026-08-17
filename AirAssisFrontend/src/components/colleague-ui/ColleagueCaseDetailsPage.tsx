import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  AddCommentOutlined,
  AddTaskOutlined,
  AssignmentTurnedInOutlined,
  DescriptionOutlined,
  FlightTakeoffOutlined,
  HubOutlined,
  LogoutOutlined,
  PersonOutlineOutlined,
  SummarizeOutlined,
} from "@mui/icons-material";
import {
  createColleagueCaseComment,
  type ColleagueCaseCommentApiError,
} from "./ColleagueCaseCommentApi";
import PortalUserHeader from "../portal/PortalUserHeader";
import { getStoredUserIdentity } from "../../utils/auth";
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
const ACCESS_TOKEN_STORAGE_KEY = "airassist_access_token";
const COMMENT_MAX_LENGTH = 1000;
const SECTION_ICON_COLOR = "#003178";

type FlightDetails = {
  flight_date: string;
  flight_number: string;
  airline: string;
  reservation_number: string;
  departing_airport: string;
  destination_airport: string;
  planned_departure_time: string;
  planned_arrival_time: string;
};

type PassengerDetails = {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  email: string;
  phone: string | null;
  address: string | null;
  postal_code: string | null;
};

type CaseDocument = {
  id: number;
  document_type: string;
  filename: string;
  uploaded_at: string;
};

type CaseComment = {
  id: number;
  text: string;
  author_email: string;
  author_role: string;
  created_at: string;
};

type ColleagueCaseDetails = {
  id: number;
  status: string;
  flight: FlightDetails | null;
  connecting_flights: FlightDetails[];
  passenger: PassengerDetails | null;
  documents: CaseDocument[];
  comments?: CaseComment[];
  created_at: string;
  updated_at: string;
};

type ColleagueCaseDetailsPageProps = {
  onLogout: () => void;
  onUnauthorized?: () => void;
  caseId?: number;
  onBack?: () => void;
};

type CaseDecision = "ELIGIBLE" | "NON_ELIGIBLE" | "AWAITING_DOCUMENTS";

const formatDate = (value: string | null | undefined) => {
  if (!value) {
    return "-";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString();
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) {
    return "-";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleString();
};

function mapStatusToChipColor(
  status: string,
):
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "error"
  | "info" {
  switch (status) {
    case "NEW":
      return "info";
    case "VALID":
    case "ELIGIBLE":
      return "success";
    case "INVALID":
    case "NON_ELIGIBLE":
      return "error";
    case "AWAITING_DOCUMENTS":
      return "warning";
    case "ASSIGNED":
      return "primary";
    default:
      return "default";
  }
}

function getStatusChipSx(status: string) {
  if (status === "NEW") {
    return {
      color: "#2563eb",
      borderColor: "#93c5fd",
      backgroundColor: "#eff6ff",
    };
  }

  if (status === "VALID") {
    return {
      color: "#2e7d32",
      borderColor: "#a5d6a7",
      backgroundColor: "#f1f8e9",
    };
  }

  if (status === "ELIGIBLE") {
    return {
      color: "#ffffff",
      borderColor: "#1b6d24",
      backgroundColor: "#1b6d24",
    };
  }

  if (status === "INVALID") {
    return {
      color: "#c62828",
      borderColor: "#ef9a9a",
      backgroundColor: "#ffebee",
    };
  }

  if (status === "NON_ELIGIBLE") {
    return {
      color: "#ffffff",
      borderColor: "#ba1a1a",
      backgroundColor: "#ba1a1a",
    };
  }

  if (status === "AWAITING_DOCUMENTS") {
    return {
      color: "#ffffff",
      borderColor: "#d97706",
      backgroundColor: "#d97706",
    };
  }

  return undefined;
}

function formatStatusLabel(status: string) {
  if (status === "NON_ELIGIBLE") {
    return "Non-eligible";
  }

  if (status === "AWAITING_DOCUMENTS") {
    return "Awaiting documents";
  }

  return status;
}

function ColleagueCaseDetailsPage({
  onLogout,
  onUnauthorized,
  caseId,
  onBack,
}: ColleagueCaseDetailsPageProps) {
  const navigate = useNavigate();
  const { caseId: routeCaseId } = useParams();
  const currentUser = getStoredUserIdentity();

  const [details, setDetails] = useState<ColleagueCaseDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentSubmitError, setCommentSubmitError] = useState("");
  const [commentSubmitSuccess, setCommentSubmitSuccess] = useState("");

  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [statusUpdateError, setStatusUpdateError] = useState<string>("");
  const [selectedDecision, setSelectedDecision] = useState<CaseDecision | "">(
    "",
  );
  const [decisionNote, setDecisionNote] = useState("");
  const [isStatusUpdateSuccessOpen, setIsStatusUpdateSuccessOpen] =
    useState(false);
  const resolvedCaseId = useMemo(() => {
    if (typeof caseId === "number" && Number.isInteger(caseId)) {
      return caseId;
    }

    if (!routeCaseId || !/^\d+$/.test(routeCaseId)) {
      return null;
    }

    return Number(routeCaseId);
  }, [caseId, routeCaseId]);

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    navigate(-1);
  };

  const normalizedCommentText = commentText.trim();
  const canSubmitComment =
    normalizedCommentText.length > 0 &&
    normalizedCommentText.length <= COMMENT_MAX_LENGTH &&
    !isSubmittingComment;
  const normalizedDecisionNote = decisionNote.trim();
  const decisionRequiresNote =
    selectedDecision === "NON_ELIGIBLE" ||
    selectedDecision === "AWAITING_DOCUMENTS";
  const canApplyDecision =
    selectedDecision !== "" &&
    (!decisionRequiresNote ||
      (normalizedDecisionNote.length > 0 &&
        normalizedDecisionNote.length <= COMMENT_MAX_LENGTH)) &&
    !isUpdatingStatus;

  const fetchDetails = useCallback(async () => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);

    if (!accessToken) {
      onUnauthorized?.();
      return;
    }

    if (resolvedCaseId === null) {
      setErrorMessage("Invalid case id.");
      setIsLoading(false);
      return;
    }

    await Promise.resolve();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/cases/colleague/${resolvedCaseId}/`,
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

      if (response.status === 404) {
        setDetails(null);
        setErrorMessage("Case not found or not accessible.");
        return;
      }

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(responseText || "Could not load case details.");
      }

      const payload = (await response.json()) as ColleagueCaseDetails;
      setDetails(payload);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Could not load case details.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [onUnauthorized, resolvedCaseId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchDetails();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [fetchDetails]);

  const submitComment = useCallback(async () => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);

    if (!accessToken) {
      onUnauthorized?.();
      return;
    }

    if (resolvedCaseId === null) {
      setCommentSubmitError("Invalid case id.");
      return;
    }

    if (!normalizedCommentText) {
      setCommentSubmitError("Comment text cannot be empty.");
      return;
    }

    if (normalizedCommentText.length > COMMENT_MAX_LENGTH) {
      setCommentSubmitError("Comment text cannot exceed 1000 characters.");
      return;
    }

    setIsSubmittingComment(true);
    setCommentSubmitError("");
    setCommentSubmitSuccess("");

    try {
      await createColleagueCaseComment({
        caseId: resolvedCaseId,
        text: normalizedCommentText,
        accessToken,
      });

      setCommentText("");
      setCommentSubmitSuccess("Comment added successfully.");
      await fetchDetails();
    } catch (error) {
      const apiError = error as Partial<ColleagueCaseCommentApiError>;
      if (apiError.status === 401 || apiError.status === 403) {
        onUnauthorized?.();
        return;
      }

      if (error instanceof Error) {
        setCommentSubmitError(error.message);
      } else {
        setCommentSubmitError("Could not add comment.");
      }
    } finally {
      setIsSubmittingComment(false);
    }
  }, [fetchDetails, normalizedCommentText, onUnauthorized, resolvedCaseId]);

  const updateCaseStatus = useCallback(
    async (status: CaseDecision, note: string) => {
      const accessToken = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);

      if (!accessToken) {
        onUnauthorized?.();
        return;
      }

      if (resolvedCaseId === null) {
        setStatusUpdateError("Invalid case id.");
        return;
      }

      setIsUpdatingStatus(true);
      setStatusUpdateError("");

      try {
        if (note) {
          await createColleagueCaseComment({
            caseId: resolvedCaseId,
            text: note,
            accessToken,
          });
        }

        await axios.post(
          `${API_BASE_URL}/api/cases/${resolvedCaseId}/status/`,
          { status, note },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );
        await fetchDetails();
        setSelectedDecision("");
        setDecisionNote("");
        setIsStatusUpdateSuccessOpen(true);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (
            error.response?.status === 401 ||
            error.response?.status === 403
          ) {
            onUnauthorized?.();
            return;
          }
          setStatusUpdateError(
            error.response?.data?.message || "Could not update case status.",
          );
          return;
        }
        setStatusUpdateError("Could not update case status.");
      } finally {
        setIsUpdatingStatus(false);
      }
    },
    [fetchDetails, onUnauthorized, resolvedCaseId],
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
          icon: <LogoutOutlined fontSize="small" />,
          onClick: onLogout,
        }}
        actions={[
          {
            label: "See Cases",
            active: true,
            icon: <AssignmentTurnedInOutlined fontSize="small" />,
            onClick: () => navigate("/colleague-cases"),
          },
          {
            label: "Create Case",
            icon: <AddTaskOutlined fontSize="small" />,
            onClick: () => navigate("/case-entry"),
          },
        ]}
      />

      <Card
        elevation={1}
        sx={{
          maxWidth: 1080,
          mx: "auto",
          mt: 3,
          border: "1px solid",
          borderColor: "divider",
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
              <Typography variant="h2">Case Details</Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
            <Button variant="outlined" onClick={handleBack}>
              Back
            </Button>
          </Stack>

          {errorMessage && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errorMessage}
            </Alert>
          )}

          {isLoading ? (
            <Box
              sx={{
                py: 8,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 1,
              }}
            >
              <CircularProgress size={28} />
              <Typography variant="body1" color="text.secondary">
                Loading case details...
              </Typography>
            </Box>
          ) : !details ? (
            <Box
              sx={{
                py: 6,
                borderRadius: 2,
                border: "1px dashed",
                borderColor: "divider",
                textAlign: "center",
              }}
            >
              <Typography variant="body1" color="text.secondary">
                No details available for this case.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={3}>
              <Card variant="outlined">
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <SummarizeOutlined sx={{ color: SECTION_ICON_COLOR }} />
                    <Typography variant="h5">Summary</Typography>
                  </Box>
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={2}
                    sx={{ justifyContent: "space-between" }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body1">Case ID:</Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          color: "#003178",
                          backgroundColor: "rgba(0, 49, 120, 0.04)",
                          borderRadius: 1,
                          px: 1,
                          py: 0.5,
                          fontWeight: 500,
                          lineHeight: 1.75,
                        }}
                      >
                        #{details.id}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body1">Status:</Typography>
                      <Chip
                        size="small"
                        label={formatStatusLabel(details.status)}
                        color={mapStatusToChipColor(details.status)}
                        sx={getStatusChipSx(details.status)}
                        variant={
                          details.status === "ASSIGNED" ? "filled" : "outlined"
                        }
                      />
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography variant="body1">
                        Created: {formatDateTime(details.created_at)}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <FlightTakeoffOutlined sx={{ color: SECTION_ICON_COLOR }} />
                    <Typography variant="h5">Flight details</Typography>
                  </Box>
                  {details.flight ? (
                    <TableContainer>
                      <Table
                        size="small"
                        sx={{
                          "& td:first-of-type": {
                            fontWeight: 400,
                            width: "38%",
                          },
                          "& td:last-of-type": { pl: 2 },
                        }}
                      >
                        <TableBody>
                          <TableRow>
                            <TableCell>Flight date</TableCell>
                            <TableCell>
                              {formatDate(details.flight.flight_date)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Flight Nr.</TableCell>
                            <TableCell>
                              {details.flight.flight_number}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Airline</TableCell>
                            <TableCell>{details.flight.airline}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Reservation Number</TableCell>
                            <TableCell>
                              {details.flight.reservation_number}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Departing Airport</TableCell>
                            <TableCell>
                              {details.flight.departing_airport}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Destination Airport</TableCell>
                            <TableCell>
                              {details.flight.destination_airport}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Planned Departure Time</TableCell>
                            <TableCell>
                              {details.flight.planned_departure_time}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Planned Arrival Time</TableCell>
                            <TableCell>
                              {details.flight.planned_arrival_time}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body1" color="text.secondary">
                      Main flight details are not available.
                    </Typography>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <HubOutlined sx={{ color: SECTION_ICON_COLOR }} />
                    <Typography variant="h6">Connecting Flights</Typography>
                  </Box>
                  {details.connecting_flights.length === 0 ? (
                    <Typography variant="body1" color="text.secondary">
                      None
                    </Typography>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Flight Date</TableCell>
                            <TableCell>Flight Nr.</TableCell>
                            <TableCell>From</TableCell>
                            <TableCell>To</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {details.connecting_flights.map((flight, index) => (
                            <TableRow key={`${flight.flight_number}-${index}`}>
                              <TableCell>
                                {formatDate(flight.flight_date)}
                              </TableCell>
                              <TableCell>{flight.flight_number}</TableCell>
                              <TableCell>{flight.departing_airport}</TableCell>
                              <TableCell>
                                {flight.destination_airport}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <PersonOutlineOutlined sx={{ color: SECTION_ICON_COLOR }} />
                    <Typography variant="h5">Passenger details</Typography>
                  </Box>
                  {details.passenger ? (
                    <TableContainer>
                      <Table
                        size="small"
                        sx={{ "& td:first-of-type": { fontWeight: 400 } }}
                      >
                        <TableBody>
                          <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>
                              {details.passenger.first_name}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Family Name</TableCell>
                            <TableCell>{details.passenger.last_name}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Date of Birth</TableCell>
                            <TableCell>
                              {formatDate(details.passenger.date_of_birth)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>E-mail</TableCell>
                            <TableCell>{details.passenger.email}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Phone</TableCell>
                            <TableCell>
                              {details.passenger.phone ?? "-"}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Address</TableCell>
                            <TableCell>
                              {details.passenger.address ?? "-"}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Postal Code</TableCell>
                            <TableCell>
                              {details.passenger.postal_code ?? "-"}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body1" color="text.secondary">
                      Passenger details are not available.
                    </Typography>
                  )}
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <DescriptionOutlined sx={{ color: SECTION_ICON_COLOR }} />
                    <Typography variant="h5">
                      Attached Documents List
                    </Typography>
                  </Box>
                  {details.documents.length === 0 ? (
                    <Typography variant="body1" color="text.secondary">
                      No documents attached.
                    </Typography>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Filename</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Upload Timestamp</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {details.documents.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.filename}</TableCell>
                              <TableCell>{item.document_type}</TableCell>
                              <TableCell>
                                {formatDateTime(item.uploaded_at)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <AddCommentOutlined sx={{ color: SECTION_ICON_COLOR }} />
                    <Typography variant="h5">Add Comment</Typography>
                  </Box>

                  <TextField
                    fullWidth
                    multiline
                    minRows={5}
                    maxRows={12}
                    value={commentText}
                    onChange={(event) => {
                      setCommentText(event.target.value);
                      if (commentSubmitError) {
                        setCommentSubmitError("");
                      }
                      if (commentSubmitSuccess) {
                        setCommentSubmitSuccess("");
                      }
                    }}
                    placeholder="Add your additional information or question here..."
                    slotProps={{ htmlInput: { maxLength: COMMENT_MAX_LENGTH } }}
                  />

                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    sx={{ mt: 1.5, alignItems: { sm: "center" } }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {commentText.length}/{COMMENT_MAX_LENGTH}
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => void submitComment()}
                      disabled={!canSubmitComment}
                    >
                      {isSubmittingComment ? "Adding..." : "Add Comment"}
                    </Button>
                  </Stack>

                  {commentSubmitError && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {commentSubmitError}
                    </Alert>
                  )}

                  {commentSubmitSuccess && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      {commentSubmitSuccess}
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h5" sx={{ mb: 2 }}>
                    Comment List
                  </Typography>
                  {(details.comments ?? []).length === 0 ? (
                    <Typography variant="body1" color="text.secondary">
                      No comments yet.
                    </Typography>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>User</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell>Timestamp</TableCell>
                            <TableCell>Comment</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(details.comments ?? []).map((comment) => (
                            <TableRow key={comment.id}>
                              <TableCell>{comment.author_email}</TableCell>
                              <TableCell>
                                {["PASSENGER", "COLLEAGUE"].includes(
                                  comment.author_role?.toUpperCase() ?? "",
                                ) ? (
                                  <Chip
                                    size="small"
                                    label={comment.author_role}
                                    color="primary"
                                  />
                                ) : (
                                  comment.author_role
                                )}
                              </TableCell>
                              <TableCell>
                                {formatDateTime(comment.created_at)}
                              </TableCell>
                              <TableCell sx={{ whiteSpace: "pre-wrap" }}>
                                {comment.text}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>

              <Card
                variant="outlined"
                sx={{
                  borderColor: "divider",
                  backgroundColor: "background.default",
                }}
              >
                <CardContent sx={{ py: { xs: 5, md: 5 } }}>
                  <Stack spacing={2.5} sx={{ alignItems: "center" }}>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography variant="h5">Eligibility decision</Typography>
                    </Box>
                    <Stack spacing={2} sx={{ width: "100%", maxWidth: 640 }}>
                      <FormControl fullWidth>
                        <InputLabel id="case-decision-label">
                          Decision
                        </InputLabel>
                        <Select
                          labelId="case-decision-label"
                          id="case-decision"
                          value={selectedDecision}
                          label="Decision"
                          disabled={isUpdatingStatus}
                          onChange={(event) => {
                            setSelectedDecision(
                              event.target.value as CaseDecision,
                            );
                            setDecisionNote("");
                          }}
                        >
                          <MenuItem value="ELIGIBLE">Eligible</MenuItem>
                          <MenuItem value="NON_ELIGIBLE">Non-eligible</MenuItem>
                          <MenuItem value="AWAITING_DOCUMENTS">
                            Awaiting documents
                          </MenuItem>
                        </Select>
                      </FormControl>
                      {decisionRequiresNote && (
                        <TextField
                          fullWidth
                          multiline
                          minRows={4}
                          maxRows={8}
                          value={decisionNote}
                          onChange={(event) =>
                            setDecisionNote(event.target.value)
                          }
                          label={
                            selectedDecision === "NON_ELIGIBLE"
                              ? "Reason for non-eligibility"
                              : "Requested documents"
                          }
                          placeholder={
                            selectedDecision === "NON_ELIGIBLE"
                              ? "Explain why this case is not eligible."
                              : "List the documents the passenger must provide."
                          }
                          disabled={isUpdatingStatus}
                          slotProps={{
                            htmlInput: { maxLength: COMMENT_MAX_LENGTH },
                          }}
                        />
                      )}
                      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                        <Button
                          variant="contained"
                          size="large"
                          disabled={!canApplyDecision}
                          onClick={() =>
                            selectedDecision &&
                            void updateCaseStatus(
                              selectedDecision,
                              normalizedDecisionNote,
                            )
                          }
                          sx={{
                            minWidth: { xs: "100%", sm: 200 },
                            minHeight: 52,
                          }}
                        >
                          {isUpdatingStatus ? "Saving..." : "Apply decision"}
                        </Button>
                      </Box>
                    </Stack>
                    {statusUpdateError && (
                      <Alert
                        severity="error"
                        sx={{ width: "100%", maxWidth: 640, mx: "auto" }}
                      >
                        {statusUpdateError}
                      </Alert>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          )}
        </CardContent>
      </Card>
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        autoHideDuration={4000}
        open={isStatusUpdateSuccessOpen}
        onClose={() => setIsStatusUpdateSuccessOpen(false)}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setIsStatusUpdateSuccessOpen(false)}
        >
          The case status was changed successfully.
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ColleagueCaseDetailsPage;
