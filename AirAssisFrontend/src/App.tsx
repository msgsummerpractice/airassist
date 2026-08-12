import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import "./App.css";
import Login from "./components/login/login";
import FlightItineraryStep from "./components/wizard/steps/FlightItineraryStep";
import AdminUsersPage from "./components/admin/AdminUsersPage";
import { isSystemAdmin } from "./utils/auth";

function App() {
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    navigate(isSystemAdmin() ? "/admin/users" : "/wizard");
  };

  return (
    <Routes>
      <Route path="/" element={<Login onLoginSuccess={handleLoginSuccess} />} />
      <Route path="/wizard" element={<FlightItineraryStep />} />
      <Route
        path="/admin/users"
        element={
          isSystemAdmin() ? <AdminUsersPage /> : <Navigate to="/" replace />
        }
      />
    </Routes>
  );
}

export default App;
