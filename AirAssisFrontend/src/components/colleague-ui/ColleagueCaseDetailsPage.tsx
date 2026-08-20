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
  IconButton,
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
  Tooltip,
  Typography,
} from "@mui/material";
import {
  AddTaskOutlined,
  AssignmentTurnedInOutlined,
  DeleteOutlined,
  DescriptionOutlined,
  DownloadOutlined,
  FlightTakeoffOutlined,
  HubOutlined,
  LockOpenOutlined,
  LockOutlined,
  LogoutOutlined,
  PersonOutlineOutlined,
  SummarizeOutlined,
  UploadFileOutlined,
} from "@mui/icons-material";
import {
  closeCaseConversation,
  deleteCaseDocument,
  downloadCaseDocument,
  reopenCaseConversation,
  uploadCaseDocument,
  type CaseApiError,
} from "../cases/api";
import {
  createColleagueCaseComment,
  type ColleagueCaseCommentApiError,
} from "./ColleagueCaseCommentApi";
import PortalUserHeader from "../portal/PortalUserHeader";
import { getStoredUserIdentity } from "../../utils/auth";
import { AppSnackbar } from "../utils/app_snackbar";
import { useAppSnackbar } from "../utils/use_app_snackbar";
import { validateDocumentFile } from "../wizard/utils/documentUploadStepValidation";
import { getCaseStatusPresentation } from "../../utils/caseStatus";
import axios from "axios";
import CommentsCard from "../cases/shared/cards/CommentsCard";
import DeleteDocumentDialog from "../cases/shared/dialogs/DeleteDocumentDialog";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
const ACCESS_TOKEN_STORAGE_KEY = "airassist_access_token";
const COMMENT_MAX_LENGTH = 1000;
const SECTION_ICON_COLOR = "#003178";
const DOCUMENT_TYPE_OPTIONS = ["BOARDING_PASS", "PASSPORT", "CONTRACT"];
const MAX_VISIBLE_FILENAME_LENGTH = 28;
const CARD_CONTENT_FONT_SX = {
  "& .MuiTypography-body1": { fontSize: "18px" },
  "& .MuiTypography-body2": { fontSize: "18px" },
  "& .MuiTypography-caption": { fontSize: "18px" },
  "& .MuiTableCell-root": { fontSize: "18px" },
  "& .MuiInputBase-input": { fontSize: "18px" },
  "& .MuiInputLabel-root": { fontSize: "18px" },
  "& .MuiMenuItem-root": { fontSize: "18px" },
  "& .MuiButton-root": { fontSize: "18px" },
  "& .MuiChip-label": { fontSize: "18px" },
};

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
  uploaded_by?: "PASSENGER" | "COLLEAGUE" | null;
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
  conversation_status: "OPEN" | "CLOSED";
  conversation_closed_at: string | null;
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

  return parsedDate.toLocaleString("en-GB");
};

const formatFilename = (filename: string) => {
  if (filename.length <= MAX_VISIBLE_FILENAME_LENGTH) {
    return filename;
  }

  return `${filename.slice(0, MAX_VISIBLE_FILENAME_LENGTH)}...`;
};

const parseDownloadFilename = (
  contentDisposition: string | null,
  fallbackFilename: string,
) => {
  if (!contentDisposition) {
    return fallbackFilename;
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const quotedMatch = contentDisposition.match(/filename="([^"]+)"/i);
  if (quotedMatch?.[1]) {
    return quotedMatch[1];
  }

  const bareMatch = contentDisposition.match(/filename=([^;]+)/i);
  if (bareMatch?.[1]) {
    return bareMatch[1].trim();
  }

  return fallbackFilename;
};

function ColleagueCaseDetailsPage({
  onLogout,
  onUnauthorized,
  caseId,
  onBack,
}: ColleagueCaseDetailsPageProps) {
  const navigate = useNavigate();
  const { caseId: routeCaseId } = useParams();
  const currentUser = getStoredUserIdentity();
  const { snackbar, closeSnackbar, showSuccessSnackbar } = useAppSnackbar();

  const [details, setDetails] = useState<ColleagueCaseDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("CONTRACT");
  const [documentError, setDocumentError] = useState("");
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [isDraggingOverDropzone, setIsDraggingOverDropzone] = useState(false);
  const [downloadingDocumentId, setDownloadingDocumentId] = useState<
    number | null
  >(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState<number | null>(
    null,
  );
  const [documentToDelete, setDocumentToDelete] = useState<CaseDocument | null>(
    null,
  );
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentSubmitError, setCommentSubmitError] = useState("");
  const [commentSubmitSuccess, setCommentSubmitSuccess] = useState("");
  const [isUpdatingConversation, setIsUpdatingConversation] = useState(false);

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
  const normalizedDecisionNote = decisionNote.trim();
  const decisionRequiresNote =
    selectedDecision === "NON_ELIGIBLE" ||
    selectedDecision === "AWAITING_DOCUMENTS";
  const canApplyDecision =
    selectedDecision !== "" &&
    selectedDecision !== details?.status &&
    (!decisionRequiresNote ||
      (normalizedDecisionNote.length > 0 &&
        normalizedDecisionNote.length <= COMMENT_MAX_LENGTH)) &&
    !isUpdatingStatus;

  const getAccessToken = useCallback(() => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);

    if (!accessToken) {
      onUnauthorized?.();
      throw new Error("Unauthorized.");
    }

    return accessToken;
  }, [onUnauthorized]);

  const handleDocumentFileChange = (file: File | null) => {
    setSelectedFile(file);
    setDocumentError(file ? validateDocumentFile(file) : "");
  };

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

  const uploadDocument = useCallback(async () => {
    const validationError = validateDocumentFile(selectedFile);

    if (validationError || !selectedFile) {
      setDocumentError(validationError);
      return;
    }

    if (resolvedCaseId === null) {
      setDocumentError("Invalid case id.");
      return;
    }

    setDocumentError("");
    setIsUploadingDocument(true);

    try {
      const payload = await uploadCaseDocument({
        caseId: resolvedCaseId,
        file: selectedFile,
        documentType,
        accessToken: getAccessToken(),
      });

      setSelectedFile(null);
      showSuccessSnackbar(payload.message || "Document uploaded successfully.");
      await fetchDetails();
    } catch (error) {
      const apiError = error as Partial<CaseApiError>;
      if (apiError.status === 401 || apiError.status === 403) {
        onUnauthorized?.();
        return;
      }

      setDocumentError(
        error instanceof Error ? error.message : "Could not upload document.",
      );
    } finally {
      setIsUploadingDocument(false);
    }
  }, [
    documentType,
    fetchDetails,
    getAccessToken,
    onUnauthorized,
    resolvedCaseId,
    selectedFile,
    showSuccessSnackbar,
  ]);

  const downloadDocument = useCallback(
    async (document: CaseDocument) => {
      if (resolvedCaseId === null) {
        setDocumentError("Invalid case id.");
        return;
      }

      setDocumentError("");
      setDownloadingDocumentId(document.id);

      try {
        const response = await downloadCaseDocument({
          caseId: resolvedCaseId,
          documentId: document.id,
          accessToken: getAccessToken(),
        });

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = window.document.createElement("a");
        link.href = downloadUrl;
        link.download = parseDownloadFilename(
          response.headers.get("Content-Disposition"),
          document.filename,
        );
        window.document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
        showSuccessSnackbar("Document downloaded successfully.");
      } catch (error) {
        const apiError = error as Partial<CaseApiError>;
        if (apiError.status === 401 || apiError.status === 403) {
          onUnauthorized?.();
          return;
        }

        setDocumentError(
          error instanceof Error
            ? error.message
            : "Could not download document.",
        );
      } finally {
        setDownloadingDocumentId(null);
      }
    },
    [getAccessToken, onUnauthorized, resolvedCaseId, showSuccessSnackbar],
  );

  const deleteDocument = useCallback(async () => {
    const document = documentToDelete;
    if (
      !document ||
      resolvedCaseId === null ||
      (document.uploaded_by !== "COLLEAGUE" &&
        document.uploaded_by !== null &&
        document.uploaded_by !== undefined)
    ) {
      return;
    }

    setDocumentError("");
    setDeletingDocumentId(document.id);

    try {
      await deleteCaseDocument({
        caseId: resolvedCaseId,
        documentId: document.id,
        accessToken: getAccessToken(),
      });
      setDocumentToDelete(null);
      showSuccessSnackbar("Document deleted successfully.");
      await fetchDetails();
    } catch (error) {
      const apiError = error as Partial<CaseApiError>;
      if (apiError.status === 401 || apiError.status === 403) {
        onUnauthorized?.();
        return;
      }

      setDocumentError(
        error instanceof Error ? error.message : "Could not delete document.",
      );
    } finally {
      setDeletingDocumentId(null);
    }
  }, [
    documentToDelete,
    fetchDetails,
    getAccessToken,
    onUnauthorized,
    resolvedCaseId,
    showSuccessSnackbar,
  ]);

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

  const updateConversation = useCallback(async () => {
    if (resolvedCaseId === null || !details) {
      return;
    }

    setIsUpdatingConversation(true);
    setCommentSubmitError("");

    try {
      const action =
        details.conversation_status === "OPEN"
          ? closeCaseConversation
          : reopenCaseConversation;
      const payload = await action({
        caseId: resolvedCaseId,
        accessToken: getAccessToken(),
      });

      showSuccessSnackbar(payload.message);
      await fetchDetails();
    } catch (error) {
      const apiError = error as Partial<CaseApiError>;
      if (apiError.status === 401 || apiError.status === 403) {
        onUnauthorized?.();
        return;
      }

      setCommentSubmitError(
        error instanceof Error
          ? error.message
          : "Could not update conversation.",
      );
    } finally {
      setIsUpdatingConversation(false);
    }
  }, [
    details,
    fetchDetails,
    getAccessToken,
    onUnauthorized,
    resolvedCaseId,
    showSuccessSnackbar,
  ]);

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
    <>
      <Box
        sx={{
          minHeight: "100vh",
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
              onClick: () => navigate("/colleague-dashboard"),
            },
            {
              label: "Create Case",
              icon: <AddTaskOutlined fontSize="small" />,
              onClick: () => navigate("/case-entry"),
            },
          ]}
        />

        <Box
          sx={{
            maxWidth: 1080,
            mx: "auto",
            px: { xs: 2, md: 4 },
            py: { xs: 3, md: 5 },
          }}
        >
          <Card
            elevation={1}
            sx={{
              maxWidth: 1080,
              mx: "auto",
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
                    <CardContent sx={CARD_CONTENT_FONT_SX}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 2,
                        }}
                      >
                        <SummarizeOutlined sx={{ color: SECTION_ICON_COLOR }} />
                        <Typography variant="h5" sx={{ fontSize: "20px" }}>
                          Summary
                        </Typography>
                      </Box>
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={2}
                        sx={{ justifyContent: "space-between" }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
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
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Typography variant="body1">Status:</Typography>
                          <Chip
                            size="small"
                            label={
                              getCaseStatusPresentation(details.status).label
                            }
                            color={
                              getCaseStatusPresentation(details.status).color
                            }
                            sx={getCaseStatusPresentation(details.status).sx}
                            variant="outlined"
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
                    <CardContent sx={CARD_CONTENT_FONT_SX}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 2,
                        }}
                      >
                        <FlightTakeoffOutlined
                          sx={{ color: SECTION_ICON_COLOR }}
                        />
                        <Typography variant="h5" sx={{ fontSize: "20px" }}>
                          Flight details
                        </Typography>
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
                              "& td:last-of-type": { pl: 2, fontWeight: 600 },
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
                        <Typography variant="h6" sx={{ fontSize: "20px" }}>
                          Connecting Flights
                        </Typography>
                      </Box>
                      {details.connecting_flights.length === 0 ? (
                        <Typography variant="body1" color="text.secondary">
                          None
                        </Typography>
                      ) : (
                        <TableContainer>
                          <Table
                            size="small"
                            sx={{
                              "& th": { fontWeight: 400 },
                              "& tbody td": { fontWeight: 600 },
                            }}
                          >
                            <TableHead>
                              <TableRow>
                                <TableCell>Flight Date</TableCell>
                                <TableCell>Flight Nr.</TableCell>
                                <TableCell>From</TableCell>
                                <TableCell>To</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {details.connecting_flights.map(
                                (flight, index) => (
                                  <TableRow
                                    key={`${flight.flight_number}-${index}`}
                                  >
                                    <TableCell>
                                      {formatDate(flight.flight_date)}
                                    </TableCell>
                                    <TableCell>
                                      {flight.flight_number}
                                    </TableCell>
                                    <TableCell>
                                      {flight.departing_airport}
                                    </TableCell>
                                    <TableCell>
                                      {flight.destination_airport}
                                    </TableCell>
                                  </TableRow>
                                ),
                              )}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </CardContent>
                  </Card>

                  <Card variant="outlined">
                    <CardContent sx={CARD_CONTENT_FONT_SX}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 2,
                        }}
                      >
                        <PersonOutlineOutlined
                          sx={{ color: SECTION_ICON_COLOR }}
                        />
                        <Typography variant="h5" sx={{ fontSize: "20px" }}>
                          Passenger details
                        </Typography>
                      </Box>
                      {details.passenger ? (
                        <TableContainer>
                          <Table
                            size="small"
                            sx={{
                              "& td:first-of-type": { fontWeight: 400 },
                              "& td:last-of-type": { fontWeight: 600 },
                            }}
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
                                <TableCell>
                                  {details.passenger.last_name}
                                </TableCell>
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
                    <CardContent sx={CARD_CONTENT_FONT_SX}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 2,
                        }}
                      >
                        <DescriptionOutlined
                          sx={{ color: SECTION_ICON_COLOR }}
                        />
                        <Typography variant="h5" sx={{ fontSize: "20px" }}>
                          Attached Documents List
                        </Typography>
                      </Box>
                      <Box
                        onDragOver={(event) => {
                          event.preventDefault();
                          setIsDraggingOverDropzone(true);
                        }}
                        onDragLeave={() => setIsDraggingOverDropzone(false)}
                        onDrop={(event) => {
                          event.preventDefault();
                          setIsDraggingOverDropzone(false);
                          handleDocumentFileChange(
                            event.dataTransfer.files?.[0] ?? null,
                          );
                        }}
                        sx={{
                          border: "1px dashed",
                          borderColor: isDraggingOverDropzone
                            ? "primary.main"
                            : "divider",
                          borderRadius: 2,
                          p: 2,
                          mb: 2,
                          backgroundColor: isDraggingOverDropzone
                            ? "rgba(0, 49, 120, 0.04)"
                            : "transparent",
                          textAlign: "center",
                        }}
                      >
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1.5 }}
                        >
                          Drag and drop a file here, or browse from your
                          computer.
                        </Typography>
                        <Stack
                          direction={{ xs: "column", md: "row" }}
                          spacing={1.5}
                          sx={{
                            alignItems: { md: "center" },
                            justifyContent: "center",
                          }}
                        >
                          <Button
                            variant="outlined"
                            component="label"
                            startIcon={<UploadFileOutlined />}
                            disabled={isUploadingDocument}
                          >
                            {selectedFile
                              ? selectedFile.name
                              : "Choose Document"}
                            <input
                              hidden
                              type="file"
                              accept="application/pdf,image/jpeg,.pdf,.jpg,.jpeg"
                              onChange={(event) => {
                                handleDocumentFileChange(
                                  event.target.files?.[0] ?? null,
                                );
                                event.target.value = "";
                              }}
                            />
                          </Button>
                          <FormControl size="small" sx={{ minWidth: 180 }}>
                            <InputLabel id="colleague-document-type-label">
                              Document Type
                            </InputLabel>
                            <Select
                              labelId="colleague-document-type-label"
                              label="Document Type"
                              value={documentType}
                              onChange={(event) =>
                                setDocumentType(event.target.value)
                              }
                            >
                              {DOCUMENT_TYPE_OPTIONS.map((option) => (
                                <MenuItem key={option} value={option}>
                                  {option.replaceAll("_", " ")}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <Button
                            variant="contained"
                            onClick={() => void uploadDocument()}
                            disabled={
                              !selectedFile ||
                              Boolean(documentError) ||
                              isUploadingDocument
                            }
                          >
                            {isUploadingDocument ? "Uploading..." : "Upload"}
                          </Button>
                        </Stack>
                      </Box>
                      {documentError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                          {documentError}
                        </Alert>
                      )}
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
                                <TableCell>Uploaded by</TableCell>
                                <TableCell>Upload Timestamp</TableCell>
                                <TableCell align="center">Actions</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {details.documents.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell>
                                    <Tooltip title={item.filename} arrow>
                                      <Typography
                                        component="span"
                                        variant="body1"
                                        sx={{
                                          maxWidth: { xs: 180, sm: 260 },
                                          display: "inline-block",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          verticalAlign: "bottom",
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        {formatFilename(item.filename)}
                                      </Typography>
                                    </Tooltip>
                                  </TableCell>
                                  <TableCell>{item.document_type}</TableCell>
                                  <TableCell>
                                    <Chip
                                      size="small"
                                      label={
                                        item.uploaded_by === "PASSENGER"
                                          ? "Passenger"
                                          : item.uploaded_by === "COLLEAGUE"
                                            ? "Colleague"
                                            : "Unknown"
                                      }
                                      sx={{
                                        backgroundColor:
                                          item.uploaded_by === "PASSENGER"
                                            ? "rgba(27, 109, 36, 0.10)"
                                            : item.uploaded_by === "COLLEAGUE"
                                              ? "rgba(0, 49, 120, 0.10)"
                                              : "transparent",
                                        color:
                                          item.uploaded_by === "PASSENGER"
                                            ? "rgb(27, 109, 36)"
                                            : item.uploaded_by === "COLLEAGUE"
                                              ? "rgb(0, 49, 120)"
                                              : "text.secondary",
                                        fontWeight: 600,
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    {formatDateTime(item.uploaded_at)}
                                  </TableCell>
                                  <TableCell align="center">
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      aria-label="Download document"
                                      title="Download"
                                      onClick={() =>
                                        void downloadDocument(item)
                                      }
                                      disabled={
                                        downloadingDocumentId === item.id
                                      }
                                    >
                                      <DownloadOutlined />
                                    </IconButton>
                                    {(item.uploaded_by === "COLLEAGUE" ||
                                      item.uploaded_by == null) && (
                                      <IconButton
                                        size="small"
                                        color="error"
                                        aria-label="Delete document"
                                        title="Delete"
                                        onClick={() =>
                                          setDocumentToDelete(item)
                                        }
                                        disabled={
                                          deletingDocumentId === item.id
                                        }
                                      >
                                        <DeleteOutlined />
                                      </IconButton>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </CardContent>
                  </Card>

                  <CommentsCard
                    comments={details.comments ?? []}
                    formatDateTime={formatDateTime}
                    commentText={commentText}
                    setCommentText={setCommentText}
                    isSubmitting={isSubmittingComment}
                    errorMessage={commentSubmitError}
                    successMessage={commentSubmitSuccess}
                    submitComment={submitComment}
                    clearMessages={() => {
                      if (commentSubmitError) {
                        setCommentSubmitError("");
                      }
                      if (commentSubmitSuccess) {
                        setCommentSubmitSuccess("");
                      }
                    }}
                    disabled={details.conversation_status === "CLOSED"}
                    disabledMessage="This conversation is closed. Reopen it to add comments."
                    headerAction={
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1.5}
                        sx={{ alignItems: { sm: "center" } }}
                      >
                        <Chip
                          size="small"
                          label={details.conversation_status}
                          color={
                            details.conversation_status === "OPEN"
                              ? "success"
                              : details.conversation_status === "CLOSED"
                                ? "error"
                                : "default"
                          }
                          variant="outlined"
                        />
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={
                            details.conversation_status === "OPEN" ? (
                              <LockOutlined />
                            ) : (
                              <LockOpenOutlined />
                            )
                          }
                          onClick={() => void updateConversation()}
                          disabled={isUpdatingConversation}
                        >
                          {isUpdatingConversation
                            ? "Updating..."
                            : details.conversation_status === "OPEN"
                              ? "Close conversation"
                              : "Reopen conversation"}
                        </Button>
                      </Stack>
                    }
                  />

                  <Card
                    variant="outlined"
                    sx={{
                      borderColor: "divider",
                      backgroundColor: "background.default",
                    }}
                  >
                    <CardContent
                      sx={{
                        py: { xs: 5, md: 5 },
                        ...CARD_CONTENT_FONT_SX,
                      }}
                    >
                      <Stack spacing={2.5} sx={{ alignItems: "center" }}>
                        <Box sx={{ textAlign: "center" }}>
                          <Typography variant="h5" sx={{ fontSize: "20px" }}>
                            Eligibility decision
                          </Typography>
                        </Box>
                        <Stack
                          spacing={2}
                          sx={{ width: "100%", maxWidth: 640 }}
                        >
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
                              <MenuItem
                                value="ELIGIBLE"
                                disabled={details.status === "ELIGIBLE"}
                              >
                                Eligible
                              </MenuItem>
                              <MenuItem
                                value="NON_ELIGIBLE"
                                disabled={details.status === "NON_ELIGIBLE"}
                              >
                                Non-eligible
                              </MenuItem>
                              <MenuItem
                                value="AWAITING_DOCUMENTS"
                                disabled={
                                  details.status === "AWAITING_DOCUMENTS"
                                }
                              >
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
                          <Box
                            sx={{ display: "flex", justifyContent: "flex-end" }}
                          >
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
                              {isUpdatingStatus
                                ? "Saving..."
                                : "Apply decision"}
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
        </Box>
        <AppSnackbar
          open={snackbar.open}
          message={snackbar.message}
          severity={snackbar.severity}
          onClose={closeSnackbar}
        />
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
      <DeleteDocumentDialog
        document={documentToDelete}
        isDeleting={deletingDocumentId !== null}
        onCancel={() => {
          if (deletingDocumentId === null) setDocumentToDelete(null);
        }}
        onConfirm={() => void deleteDocument()}
      />
    </>
  );
}

export default ColleagueCaseDetailsPage;
