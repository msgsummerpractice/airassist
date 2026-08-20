import { useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import "./App.css";
import ColleagueCasesPage from "./components/colleague-ui/ColleagueCasesPage";
import ColleagueDashboard from "./components/colleague-ui/ColleagueDashboard";
import Login from "./components/login/login";
import ResetPassword from "./components/login/reset_password";
import PassengerCasesPage from "./components/passenger/PassengerCasesPage";
import { useAuthView } from "./components/wizard/utils/use_auth_view";
import CaseEntryForm from "./components/wizard/CaseEntryForm";
import AdminUsersPage from "./components/admin/AdminUsersPage";
import AdminCasesPage from "./components/admin/AdminCasesPage";
import AdminSystemOptionsPage from "./components/admin/AdminSystemOptionsPage";
import Footer from "./components/portal/Footer";
import BackgroundMusic from "./components/utils/BackgroundMusic";
import PrivacyPolicy from "./components/legal/PrivacyPolicy/PrivacyPolicy";
import TermsOfService from "./components/legal/TermsOfService/TermsOfService";
import Imprint from "./components/legal/Imprint/Imprint";
import EuInfo from "./components/legal/EuInfo/EuInfo";
import HomePage from "./components/home/HomePage";

function App() {
  const { view, role, resolveView, showCaseEntry, showColleagueDashboard } =
    useAuthView();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const handleShowCaseEntry = () => {
    showCaseEntry();
    navigate("/case-entry");
  };

  useEffect(() => {
    const currentPathname = pathname;
    if (
      (currentPathname === "/" && view === "login") ||
      currentPathname === "/reset-password" ||
      currentPathname.startsWith("/passenger-cases") ||
      currentPathname.startsWith("/colleague-cases") ||
      currentPathname === "/privacy-policy" ||
      currentPathname === "/terms-of-service" ||
      currentPathname === "/imprint" ||
      currentPathname === "/eu-261-2004-info"
    ) {
      return;
    }

    if (view === "colleague-dashboard") {
      navigate("/colleague-dashboard", { replace: true });
      return;
    }
    if (view === "case-entry") {
      if (currentPathname !== "/case-entry") {
        navigate("/case-entry", { replace: true });
      }
      return;
    }
    if (view === "admin-users" && !currentPathname.startsWith("/admin/")) {
      navigate("/admin/users", { replace: true });
      return;
    }
    // Only re-run when the resolved view itself changes (e.g. right after
    // login) — re-running on pathname/navigate changes would fight manual
    // in-app navigation such as the logo click.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  if (view === "resolving") return null;
  return (
    <div className="app-shell">
      <main className="app-content">
        <Routes>
          <Route path="/" element={<HomePage onCreateCase={handleShowCaseEntry} />} />
          <Route
            path="/login"
            element={
              <Login
                onLoginSuccess={resolveView}
                onPasswordResetSuccess={resolveView}
              />
            }
          />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/passenger-cases" element={<PassengerCasesPage />} />
          <Route
            path="/passenger-cases/:caseId"
            element={<PassengerCasesPage />}
          />
          <Route
            path="/colleague-cases"
            element={
              <ColleagueCasesPage
                isAllowed={role === "COLLEAGUE"}
                onCreateCase={handleShowCaseEntry}
              />
            }
          />
          <Route
            path="/colleague-cases/:caseId"
            element={
              <ColleagueCasesPage
                isAllowed={role === "COLLEAGUE"}
                onCreateCase={handleShowCaseEntry}
              />
            }
          />
          <Route
            path="/case-entry"
            element={
              <CaseEntryForm
                isColleagueCaseEntry={role === "COLLEAGUE"}
                onShowColleagueDashboard={showColleagueDashboard}
              />
            }
          />
          <Route
            path="/colleague-dashboard"
            element={
              role === "COLLEAGUE" ? (
                <ColleagueDashboard onCreateCase={handleShowCaseEntry} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/admin/users"
            element={
              view === "admin-users" ? (
                <AdminUsersPage />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/admin/cases"
            element={
              view === "admin-users" ? (
                <AdminCasesPage />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/admin/cases/:caseId"
            element={
              view === "admin-users" ? (
                <AdminCasesPage />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/admin/system-options"
            element={
              view === "admin-users" ? (
                <AdminSystemOptionsPage />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/imprint" element={<Imprint />} />
          <Route path="/eu-261-2004-info" element={<EuInfo />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <BackgroundMusic />
    </div>
  );
}

export default App;
