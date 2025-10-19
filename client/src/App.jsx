import { Routes, Route, Navigate } from "react-router-dom";
import "./styles/login.css";
import "./styles/admin.css";
import "./styles/student.css";

import Landing from "./pages/Landing";
import LoginEmail from "./pages/LoginEmail";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import AuthGuard from "./components/AuthGuard";

import StudentLayout from "./pages/student/StudentLayout";
import StudentDashboard from "./pages/student/StudentDashboard";
import AvailableQuizzes from "./pages/student/AvailableQuizzes";
import MyResults from "./pages/student/MyResults";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminModules from "./pages/admin/Modules";
import AdminQuizzes from "./pages/admin/Quizzes";
import AdminQuestions from "./pages/admin/Questions";
import AdminUsers from "./pages/admin/Users";

import QuizPlayer from "./pages/QuizPlayer";
import QuizResult from "./pages/QuizResult";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<LoginEmail />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot" element={<ForgotPassword />} />

      <Route
        path="/"
        element={
          <AuthGuard allow="any">
            <StudentLayout />
          </AuthGuard>
        }
      >
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="available" element={<AvailableQuizzes />} />
        <Route path="results" element={<MyResults />} />
      </Route>


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
        <Route path="users" element={<AdminUsers />} />
      </Route>

      <Route
        path="/play/:quizId"
        element={
          <AuthGuard allow="any">
            <QuizPlayer />
          </AuthGuard>
        }
      />
      <Route
        path="/result/:attemptId"
        element={
          <AuthGuard allow="any">
            <QuizResult />
          </AuthGuard>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
