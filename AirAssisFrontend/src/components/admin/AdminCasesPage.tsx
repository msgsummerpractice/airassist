import { useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import {
  FolderOutlined as FolderIcon,
  GroupOutlined as GroupIcon,
  LogoutOutlined as LogoutOutlinedIcon,
  SettingsOutlined as SettingsIcon,
} from "@mui/icons-material";
import { Box, Button, Stack } from "@mui/material";

import {
  getStoredUserIdentity,
  logoutToGuestCaseEntry,
} from "../../utils/auth";
import PortalUserHeader from "../portal/PortalUserHeader";
import AdminCaseDetailsPage from "./AdminCaseDetailsPage";
import AdminCaseList from "./AdminCaseList";

const ACCESS_TOKEN_STORAGE_KEY = "airassist_access_token";

function AdminCasesPage() {
  const navigate = useNavigate();
  const { caseId } = useParams();
  const currentUser = getStoredUserIdentity();
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    Boolean(localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)),
  );
  const selectedCaseId = useMemo(() => {
    if (!caseId || !/^\d+$/.test(caseId)) return null;
    return Number(caseId);
  }, [caseId]);

  const handleLogout = () => {
    logoutToGuestCaseEntry();
  };

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (selectedCaseId !== null) {
    return (
      <AdminCaseDetailsPage
        caseId={selectedCaseId}
        onLogout={handleLogout}
        onUnauthorized={() => setIsAuthenticated(false)}
        onBack={() => navigate("/admin/cases")}
      />
    );
  }

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
            active: true,
            icon: <FolderIcon fontSize="small" />,
            onClick: () => navigate("/admin/cases"),
          },
          {
            label: "System Options",
            icon: <SettingsIcon fontSize="small" />,
            onClick: () => navigate("/admin/system-options"),
          },
        ]}
      />

      <Box
        sx={{
          maxWidth: 1220,
          mx: "auto",
          px: { xs: 2, md: 4 },
          py: { xs: 3, md: 5 },
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{
            mb: 3,
            justifyContent: "flex-start",
            alignItems: { xs: "stretch", sm: "center" },
          }}
        >
          <Button
            variant="outlined"
            onClick={() => navigate("/admin/users")}
          >
            Back
          </Button>
        </Stack>

        <AdminCaseList />
      </Box>
    </Box>
  );
}

export default AdminCasesPage;
