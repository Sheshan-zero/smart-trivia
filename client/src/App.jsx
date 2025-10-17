import { Routes, Route, Navigate } from "react-router-dom";
import "./styles/login.css";
import "./styles/admin.css";
import LoginEmail from "./pages/LoginEmail";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import AuthGuard from "./components/AuthGuard";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminModules from "./pages/admin/Modules";
import AdminQuizzes from "./pages/admin/Quizzes";
import AdminQuestions from "./pages/admin/Questions";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginEmail />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot" element={<ForgotPassword />} />

      {/* Student area */}
      <Route
        path="/dashboard"
        element={
          <AuthGuard allow="any">
            <Dashboard />
          </AuthGuard>
        }
      />

      {/* Admin area with layout + nested pages */}
      <Route
        path="/admin"
        element={
          <AuthGuard allow="admin">
            <AdminLayout />
          </AuthGuard>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="modules" element={<AdminModules />} />
        <Route path="quizzes" element={<AdminQuizzes />} />
        <Route path="questions" element={<AdminQuestions />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
