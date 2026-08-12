import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import "./App.css";
import CaseEntryForm from "./components/wizard/CaseEntryForm";

function App() {
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    navigate(isSystemAdmin() ? "/admin/users" : "/wizard");
  };

  return (
    <>
      <div>
        <CaseEntryForm />
      </div>
    </>
  );
}

export default App;
