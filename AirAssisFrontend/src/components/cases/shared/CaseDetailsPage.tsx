import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AddTaskOutlined,
  AssignmentTurnedInOutlined,
  FolderOutlined,
  GroupOutlined,
  LogoutOutlined,
  SettingsOutlined,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";

import PortalUserHeader from "../../portal/PortalUserHeader";
import { getStoredUserIdentity } from "../../../utils/auth";
import { AppSnackbar } from "../../utils/app_snackbar";
import { useAppSnackbar } from "../../utils/use_app_snackbar";
import { useCaseComment, useCaseDetails } from "../hooks";
import type { CaseDetailsConfig } from "../caseConfig";
import AddCommentCard from "./cards/AddCommentCard";
import CaseSummaryCard from "./cards/CaseSummaryCard";
import CommentListCard from "./cards/CommentListCard";
import DocumentsCard from "./cards/DocumentsCard";
import FlightDetailsCard from "./cards/FlightDetailsCard";
import PassengerDetailsCard from "./cards/PassengerDetailsCard";

export type CaseDetailsPageProps = {
  config: CaseDetailsConfig;
  onLogout: () => void;
  onUnauthorized?: () => void;
  caseId?: number;
  onBack?: () => void;
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const ADMIN_CARD_TITLE_SX = {
  "& .MuiTypography-h5": { fontSize: "20px" },
  "& .MuiTypography-h6": { fontSize: "20px" },
};

const ADMIN_CARD_CONTENT_SX = {
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

function CaseDetailsPage({
  config,
  onLogout,
  onUnauthorized,
  caseId,
  onBack,
}: CaseDetailsPageProps) {
  const navigate = useNavigate();
  const { caseId: routeCaseId } = useParams();
  const currentUser = getStoredUserIdentity();
  const { snackbar, closeSnackbar, showSuccessSnackbar } = useAppSnackbar();
  const resolvedCaseId = useMemo(() => {
    if (typeof caseId === "number" && Number.isInteger(caseId)) return caseId;
    if (!routeCaseId || !/^\d+$/.test(routeCaseId)) return null;
    return Number(routeCaseId);
  }, [caseId, routeCaseId]);
  const { details, isLoading, errorMessage, reload } = useCaseDetails({
    caseId: resolvedCaseId,
    scope: config.scope,
    onUnauthorized,
  });
  const comment = useCaseComment({
    caseId: resolvedCaseId,
    scope: config.scope,
    onUnauthorized,
    onCommentCreated: reload,
  });
  const adminCardSx =
    config.scope === "admin"
      ? { ...ADMIN_CARD_TITLE_SX, ...ADMIN_CARD_CONTENT_SX }
      : undefined;

  const handleBack = () => (onBack ? onBack() : navigate(-1));
  const headerActions =
    config.scope === "admin"
      ? [
          {
            label: "User View",
            icon: <GroupOutlined fontSize="small" />,
            onClick: () => navigate("/admin/users"),
          },
          {
            label: "Case View",
            active: true,
            icon: <FolderOutlined fontSize="small" />,
            onClick: () => navigate("/admin/cases"),
          },
          {
            label: "System Options",
            icon: <SettingsOutlined fontSize="small" />,
            onClick: () => navigate("/admin/system-options"),
          },
        ]
      : [
          {
            label: config.casesLabel,
            active: true,
            icon: <AssignmentTurnedInOutlined fontSize="small" />,
            onClick: () => navigate(config.listPath),
          },
          ...(config.createCaseLabel
            ? [
                {
                  label: config.createCaseLabel,
                  icon: <AddTaskOutlined fontSize="small" />,
                  onClick: () => navigate("/case-entry"),
                },
              ]
            : []),
        ];

  return (
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
        actions={headerActions}
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
            <Box sx={{ textAlign: "center", mb: 3 }}>
              <Typography variant="h2" sx={{ mt: 0.5 }}>
                Case Details
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mt: 0.5, maxWidth: 720, mx: "auto" }}
              >
                {config.description}
              </Typography>
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
                <Typography color="text.secondary">
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
                <Typography color="text.secondary">
                  No details available for this case.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={3}>
                <Box sx={adminCardSx}>
                  <CaseSummaryCard
                    details={details}
                    formatDateTime={formatDateTime}
                  />
                </Box>
                <Box sx={adminCardSx}>
                  <FlightDetailsCard details={details} formatDate={formatDate} />
                </Box>
                <Box sx={adminCardSx}>
                  <PassengerDetailsCard
                    passenger={details.passenger}
                    formatDate={formatDate}
                  />
                </Box>
                <Box sx={adminCardSx}>
                  <DocumentsCard
                    caseId={details.id}
                    documents={details.documents}
                    formatDateTime={formatDateTime}
                    canManageDocuments={config.scope === "colleague"}
                    onDocumentUploaded={reload}
                    onUploadSuccess={showSuccessSnackbar}
                    onDownloadSuccess={showSuccessSnackbar}
                    onUnauthorized={onUnauthorized}
                  />
                </Box>
                {config.canAddComments !== false && (
                  <AddCommentCard {...comment} />
                )}
                <Box
                  sx={
                    config.scope === "admin" ? ADMIN_CARD_TITLE_SX : undefined
                  }
                >
                  <CommentListCard
                    comments={details.comments ?? []}
                    formatDateTime={formatDateTime}
                  />
                </Box>
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
    </Box>
  );
}

export default CaseDetailsPage;
