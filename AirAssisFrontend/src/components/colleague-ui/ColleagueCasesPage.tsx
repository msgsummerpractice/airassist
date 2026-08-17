import { useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import ColleagueCaseList from "./ColleagueCaseList";
import ColleagueCaseDetailsPage from "./ColleagueCaseDetailsPage";
import { clearStoredUserIdentity } from "../../utils/auth";

const ACCESS_TOKEN_STORAGE_KEY = "airassist_access_token";
const REFRESH_TOKEN_STORAGE_KEY = "airassist_refresh_token";

type ColleagueCasesPageProps = {
  isAllowed: boolean;
  onCreateCase: () => void;
};

function ColleagueCasesPage({ isAllowed }: ColleagueCasesPageProps) {
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

  if (!isAllowed || !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (selectedCaseId !== null) {
    return (
      <ColleagueCaseDetailsPage
        caseId={selectedCaseId}
        onLogout={handleLogout}
        onUnauthorized={() => setIsAuthenticated(false)}
        onBack={() => navigate("/colleague-cases")}
      />
    );
  }

  return <ColleagueCaseList />;
}

export default ColleagueCasesPage;