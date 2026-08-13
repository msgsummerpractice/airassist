import { useState } from "react";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Navigate } from "react-router-dom";

import Login from "../login/login";
import PassengerCaseDetailsPage from "./PassengerCaseDetailsPage";
import PastCasesView from "./PastCasesView";
import { clearStoredUserIdentity, getTokenRole } from "../../utils/auth";

const ACCESS_TOKEN_STORAGE_KEY = "airassist_access_token";
const REFRESH_TOKEN_STORAGE_KEY = "airassist_refresh_token";

function PassengerCasesPage() {
  const navigate = useNavigate();
  const { caseId } = useParams();

  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY),
  );

  const selectedCaseId = useMemo(() => {
    if (!caseId || !/^\d+$/.test(caseId)) {
      return null;
    }

    return Number(caseId);
  }, [caseId]);

  const handleLogout = () => {
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    clearStoredUserIdentity();
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <Login
        onLoginSuccess={() => setIsAuthenticated(true)}
        onPasswordResetSuccess={() => setIsAuthenticated(true)}
      />
    );
  }

  if (selectedCaseId !== null) {
    return (
      <PassengerCaseDetailsPage
        caseId={selectedCaseId}
        onLogout={handleLogout}
        onUnauthorized={() => setIsAuthenticated(false)}
        onBack={() => navigate("/passenger/cases")}
      />
    );
  if (getTokenRole() === "COLLEAGUE") {
    return <Navigate to="/colleague-cases" replace />;
  }

  return (
    <PastCasesView
      onLogout={handleLogout}
      onUnauthorized={() => setIsAuthenticated(false)}
      onOpenCaseDetails={(nextCaseId) =>
        navigate(`/passenger/cases/${nextCaseId}`)
      }
    />
  );
}

export default PassengerCasesPage;
