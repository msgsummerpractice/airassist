import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
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
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  LogoutOutlined,
  PersonOutlineOutlined,
  SummarizeOutlined,
  UploadFileOutlined,
} from "@mui/icons-material";
import {
  createCaseComment,
  deleteCaseDocument,
  downloadCaseDocument,
  uploadCaseDocument,
  type CaseApiError,
} from "../cases/api";
import CommentsCard from "../cases/shared/cards/CommentsCard";
import DeleteDocumentDialog from "../cases/shared/dialogs/DeleteDocumentDialog";
import PortalUserHeader from "../portal/PortalUserHeader";
import { AppSnackbar } from "../utils/app_snackbar";
import { useAppSnackbar } from "../utils/use_app_snackbar";
import { validateDocumentFile } from "../wizard/utils/documentUploadStepValidation";
import { getStoredUserIdentity } from "../../utils/auth";
import { getCaseStatusPresentation } from "../../utils/caseStatus";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
const ACCESS_TOKEN_STORAGE_KEY = "airassist_access_token";
const COMMENT_MAX_LENGTH = 1000;
const SECTION_ICON_COLOR = "#003178";
const DOCUMENT_TYPE_OPTIONS = ["BOARDING_PASS", "PASSPORT", "CONTRACT"];

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
  download_url?: string | null;
};

type CaseComment = {
  id: number;
  text: string;
  author_email: string;
  author_role: string;
  created_at: string;
};

type PassengerCaseDetails = {
  id: number;
  status: string;
  flight: FlightDetails | null;
  connecting_flights: FlightDetails[];
  passenger: PassengerDetails | null;
  documents: CaseDocument[];
  can_upload_documents?: boolean;
  conversation_status?: "OPEN" | "CLOSED";
  conversation_closed_at?: string | null;
  comments?: CaseComment[];
  created_at: string;
  updated_at: string;
};

type PassengerCaseDetailsPageProps = {
  onLogout: () => void;
  onUnauthorized?: () => void;
  caseId?: number;
  onBack?: () => void;
};

const formatDate = (value: string | null | undefined) => {
  if (!value) {
    return "-";
  }

  const parsedDate = dayjs(value);
  if (!parsedDate.isValid()) {
    return value;
  }

  return parsedDate.format("DD/MM/YYYY");
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

function PassengerCaseDetailsPage({
  onLogout,
  onUnauthorized,
  caseId,
  onBack,
}: PassengerCaseDetailsPageProps) {
  const navigate = useNavigate();
  const { caseId: routeCaseId } = useParams();
  const currentUser = getStoredUserIdentity();
  const { snackbar, closeSnackbar, showSuccessSnackbar } = useAppSnackbar();

  const [details, setDetails] = useState<PassengerCaseDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("BOARDING_PASS");
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
  const conversationStatus = details?.conversation_status ?? "OPEN";

  const getAccessToken = useCallback(() => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);

    if (!accessToken) {
      onUnauthorized?.();
      throw new Error("Unauthorized.");
    }

    return accessToken;
  }, [onUnauthorized]);

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

  const handleDocumentFileChange = useCallback((file: File | null) => {
    setSelectedFile(file);
    setDocumentError(file ? validateDocumentFile(file) : "");
  }, []);

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
        `${API_BASE_URL}/api/cases/me/${resolvedCaseId}/`,
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

      const payload = (await response.json()) as PassengerCaseDetails;
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
      await createCaseComment({
        scope: "passenger",
        caseId: resolvedCaseId,
        text: normalizedCommentText,
        accessToken,
      });

      setCommentText("");
      setCommentSubmitSuccess("Comment added successfully.");
      await fetchDetails();
    } catch (error) {
      const apiError = error as Partial<CaseApiError>;
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
        scope: "passenger",
        caseId: resolvedCaseId,
        file: selectedFile,
        documentType,
        accessToken: getAccessToken(),
      });

      setSelectedFile(null);
      setDocumentType("BOARDING_PASS");
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
    async (documentItem: CaseDocument) => {
      if (resolvedCaseId === null) {
        setDocumentError("Invalid case id.");
        return;
      }

      setDocumentError("");
      setDownloadingDocumentId(documentItem.id);

      try {
        const response = documentItem.download_url
          ? await fetch(
              documentItem.download_url.startsWith("http")
                ? documentItem.download_url
                : `${API_BASE_URL}${documentItem.download_url}`,
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${getAccessToken()}`,
                },
              },
            )
          : await downloadCaseDocument({
              scope: "passenger",
              caseId: resolvedCaseId,
              documentId: documentItem.id,
              accessToken: getAccessToken(),
            });

        if (response.status === 401 || response.status === 403) {
          onUnauthorized?.();
          return;
        }

        if (!response.ok) {
          throw new Error("Could not download document.");
        }

        const blob = await response.blob();
        const objectUrl = window.URL.createObjectURL(blob);
        const link = window.document.createElement("a");
        link.href = objectUrl;
        link.download = parseDownloadFilename(
          response.headers.get("Content-Disposition"),
          documentItem.filename,
        );
        window.document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(objectUrl);
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
    const documentItem = documentToDelete;
    if (
      !documentItem ||
      resolvedCaseId === null ||
      (documentItem.uploaded_by !== "PASSENGER" &&
        documentItem.uploaded_by !== null &&
        documentItem.uploaded_by !== undefined)
    ) {
      return;
    }

    setDocumentError("");
    setDeletingDocumentId(documentItem.id);

    try {
      await deleteCaseDocument({
        scope: "passenger",
        caseId: resolvedCaseId,
        documentId: documentItem.id,
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

  return (
    <>
      <AppSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
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
              label: "My Cases",
              active: true,
              icon: <AssignmentTurnedInOutlined fontSize="small" />,
              onClick: () => navigate("/passenger-cases"),
            },
            {
              label: "New Claim",
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
                  <Typography variant="h2" sx={{ mt: 0.5 }}>
                    Case Details
                  </Typography>
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
                    <CardContent>
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
                              "& td:last-of-type": { pl: 2, fontWeight: 600 },
                            }}
                          >
                          <TableBody>
                            <TableRow>
                              <TableCell>Flight Date</TableCell>
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
                            {details.connecting_flights.map((flight, index) => (
                              <TableRow
                                key={`${flight.flight_number}-${index}`}
                              >
                                <TableCell>
                                  {formatDate(flight.flight_date)}
                                </TableCell>
                                <TableCell>{flight.flight_number}</TableCell>
                                <TableCell>
                                  {flight.departing_airport}
                                </TableCell>
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
                      <PersonOutlineOutlined
                        sx={{ color: SECTION_ICON_COLOR }}
                      />
                      <Typography variant="h5">Passenger details</Typography>
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

                    {details.can_upload_documents ? (
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
                            <InputLabel id="passenger-document-type-label">
                              Document Type
                            </InputLabel>
                            <Select
                              labelId="passenger-document-type-label"
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
                    ) : details.can_upload_documents === false ? (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        Document uploads are available after the colleague
                        requests additional documents.
                      </Alert>
                    ) : null}

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
                              <TableRow
                                key={item.id}
                                sx={{
                                  backgroundColor:
                                    item.uploaded_by === "PASSENGER"
                                      ? "rgba(27, 109, 36, 0.10)"
                                      : item.uploaded_by === "COLLEAGUE"
                                        ? "rgba(0, 49, 120, 0.10)"
                                        : "transparent",
                                }}
                              >
                                <TableCell>{item.filename}</TableCell>
                                <TableCell>{item.document_type}</TableCell>
                                <TableCell>
                                  {item.uploaded_by === "PASSENGER"
                                    ? "Passenger"
                                    : item.uploaded_by === "COLLEAGUE"
                                      ? "Colleague"
                                      : "Unknown"}
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
                                    onClick={() => void downloadDocument(item)}
                                    disabled={downloadingDocumentId === item.id}
                                  >
                                    <DownloadOutlined />
                                  </IconButton>
                                  {(item.uploaded_by === "PASSENGER" ||
                                    item.uploaded_by == null) && (
                                    <IconButton
                                      size="small"
                                      color="error"
                                      aria-label="Delete document"
                                      title="Delete"
                                      onClick={() => setDocumentToDelete(item)}
                                      disabled={deletingDocumentId === item.id}
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
                  disabled={conversationStatus === "CLOSED"}
                  disabledMessage={
                    conversationStatus === "CLOSED"
                      ? [
                          "This conversation is closed by the colleague.",
                          "You can view existing messages, but cannot add new comments.",
                        ].join(" ")
                      : undefined
                  }
                  headerAction={
                    <Chip
                      size="small"
                      label={conversationStatus}
                      color={
                        conversationStatus === "OPEN" ? "success" : "default"
                      }
                      variant="outlined"
                    />
                  }
                />
              </Stack>
            )}
          </CardContent>
        </Card>
      </Box>
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

export default PassengerCaseDetailsPage;
