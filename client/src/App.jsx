import { Routes, Route, Navigate } from "react-router-dom";
import "./styles/login.css";
import LoginEmail from "./pages/LoginEmail";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import AdminHome from "./pages/AdminHome";
import AuthGuard from "./components/AuthGuard";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginEmail />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot" element={<ForgotPassword />} />

      <Route
        path="/dashboard"
        element={
          <AuthGuard allow="any">
            <Dashboard />
          </AuthGuard>
        }
      />

      <Route
        path="/admin"
        element={
          <AuthGuard allow="admin">
            <AdminHome />
          </AuthGuard>
        }
      />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
