import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import "./App.css";
import ColleagueDashboard from "./components/colleague-ui/ColleagueDashboard";
import Login from "./components/login/login";
import { useAuthView } from "./components/wizard/utils/use_auth_view";
import CaseEntryForm from "./components/wizard/CaseEntryForm";

function App() {
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    navigate(isSystemAdmin() ? "/admin/users" : "/wizard");
  };
  const { view, resolveView, showCaseEntry } = useAuthView();

  if (view === "colleague-dashboard") {
    return <ColleagueDashboard onCreateCase={showCaseEntry} />;
  }

  if (view === "case-entry") {
    return <CaseEntryForm />;
  }

  if (view === "resolving") {
    return null;
  }

  return (
    <Login onLoginSuccess={resolveView} onPasswordResetSuccess={resolveView} />
  );
}

export default App;
