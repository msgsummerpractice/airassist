import { useState } from "react";

import Login from "../login/login";
import PastCasesView from "./PastCasesView";

const ACCESS_TOKEN_STORAGE_KEY = "airassist_access_token";
const REFRESH_TOKEN_STORAGE_KEY = "airassist_refresh_token";

function PassengerCasesPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY),
  );

  const handleLogout = () => {
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
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

  return (
    <PastCasesView
      onLogout={handleLogout}
      onUnauthorized={() => setIsAuthenticated(false)}
    />
  );
}

export default PassengerCasesPage;
