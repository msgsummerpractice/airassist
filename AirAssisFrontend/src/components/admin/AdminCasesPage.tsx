import { useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import {
  LogoutOutlined as LogoutOutlinedIcon,
  SettingsOutlined as SettingsIcon,
} from "@mui/icons-material";
import { Box } from "@mui/material";

import {
  clearStoredUserIdentity,
  getStoredUserIdentity,
} from "../../utils/auth";
import PortalUserHeader from "../portal/PortalUserHeader";
import AdminCaseDetailsPage from "./AdminCaseDetailsPage";
import AdminCaseList from "./AdminCaseList";

const ACCESS_TOKEN_STORAGE_KEY = "airassist_access_token";
const REFRESH_TOKEN_STORAGE_KEY = "airassist_refresh_token";

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
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    clearStoredUserIdentity();
    setIsAuthenticated(false);
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
            label: "System Options",
            icon: <SettingsIcon fontSize="small" />,
            onClick: () => navigate("/admin/system-options"),
          },
          {
            label: "System View",
            icon: <SettingsIcon fontSize="small" />,
            onClick: () => undefined,
          },
        ]}
      />
      <Box sx={{ mt: 3 }}>
        <AdminCaseList />
      </Box>
    </Box>
  );
}

export default AdminCasesPage;
