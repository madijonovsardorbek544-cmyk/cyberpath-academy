import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Loader } from "./ui";
import type { Role } from "../types";

export function ProtectedRoute({ children, roles }: { children: JSX.Element; roles?: Role[] }) {
  const { user, loading } = useAuth();

  if (loading) return <Loader text="Restoring session..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;

  return children;
}
