import { Navigate, Outlet, useLocation } from "react-router-dom";
import { canAccessPath, clearCurrentUser, defaultPathForRole, getCurrentUser, hasLogin } from "../utils/auth.js";

export default function ProtectedRoute() {
  const location = useLocation();

  try {
    if (!hasLogin()) return <Navigate to="/login" replace state={{ redirectTo: `${location.pathname}${location.search}` }} />;

    const user = getCurrentUser();
    if (!canAccessPath(location.pathname, user)) {
      return <Navigate to={defaultPathForRole(user.roleCode || user.role)} replace />;
    }

    return <Outlet />;
  } catch {
    clearCurrentUser();
    return <Navigate to="/login" replace />;
  }
}
