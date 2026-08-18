import { useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import ColleagueCaseList from "./ColleagueCaseList";
import ColleagueCaseDetailsPage from "./ColleagueCaseDetailsPage";
import { logoutToGuestCaseEntry } from "../../utils/auth";

const ACCESS_TOKEN_STORAGE_KEY = "airassist_access_token";

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
    logoutToGuestCaseEntry();
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
        onBack={() => navigate("/colleague-dashboard")}
      />
    );
  }

  return <ColleagueCaseList />;
}

export default ColleagueCasesPage;