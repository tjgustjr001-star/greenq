import { Navigate, Outlet } from "react-router-dom";
import { getCurrentUser, clearCurrentUser } from "../utils/auth.js";

export default function ProtectedRoute() {
  try {
    const user = getCurrentUser();
    if (!user || !user.loginId) return <Navigate to="/login" replace />;
    return <Outlet />;
  } catch {
    clearCurrentUser();
    return <Navigate to="/login" replace />;
  }
}
