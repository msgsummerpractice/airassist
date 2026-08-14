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

function App() {
  const { view, role, resolveView, showCaseEntry } = useAuthView();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  useEffect(() => {
    if (
      pathname === "/reset-password" ||
      pathname.startsWith("/passenger-cases") ||
      pathname.startsWith("/colleague-cases")
    ) {
      return;
    }

    if (view === "colleague-dashboard") {
      navigate("/colleague-dashboard", { replace: true });
      return;
    }
    if (view === "case-entry") {
      if (pathname !== "/case-entry") {
        navigate("/case-entry", { replace: true });
      }
      return;
    }
    if (view === "admin-users") {
      navigate("/admin/users", { replace: true });
      return;
    }
  }, [view, navigate, pathname]);

  if (view === "resolving") return null;
  return (
    <Routes>
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
      <Route path="/passenger-cases/:caseId" element={<PassengerCasesPage />} />
      <Route
        path="/colleague-cases"
        element={
          <ColleagueCasesPage
            isAllowed={view === "colleague-dashboard"}
            onCreateCase={showCaseEntry}
          />
        }
      />
      <Route
        path="/colleague-cases/:caseId"
        element={
          <ColleagueCasesPage
            isAllowed={view === "colleague-dashboard"}
            onCreateCase={showCaseEntry}
          />
        }
      />
      <Route
        path="/case-entry"
        element={<CaseEntryForm isColleagueCaseEntry={role === "COLLEAGUE"} />}
      />
      <Route
        path="/colleague-dashboard"
        element={
          view === "colleague-dashboard" ? (
            <ColleagueDashboard onCreateCase={showCaseEntry} />
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
      <Route path="*" element={<Navigate to="/case-entry" replace />} />
    </Routes>
  );
}

export default App;
