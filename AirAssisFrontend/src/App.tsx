import { useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import "./App.css";
import ColleagueDashboard from "./components/colleague-ui/ColleagueDashboard";
import Login from "./components/login/login";
import { useAuthView } from "./components/wizard/utils/use_auth_view";
import CaseEntryForm from "./components/wizard/CaseEntryForm";
import AdminUsersPage from "./components/admin/AdminUsersPage";

function App() {
  const { view, resolveView, showCaseEntry } = useAuthView();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  useEffect(() => {
    if (view === "colleague-dashboard") {
      navigate("/colleague-dashboard", { replace: true });
      return;
    }
    if (view === "admin-users") {
      navigate("/admin/users", { replace: true });
      return;
    }
    if (view === "login") {
      if (pathname !== "/case-entry") {
        navigate("/login", { replace: true });
      }
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
      <Route path="/case-entry" element={<CaseEntryForm />} />
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
