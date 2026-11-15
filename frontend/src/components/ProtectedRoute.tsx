import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { FullScreenLoading } from "@/components/Loading";

interface ProtectedRouteProps {
  children: ReactNode;
  role?: "ADMIN" | "STUDENT";
}

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) return <FullScreenLoading />;
  if (!user) return <Navigate to="/iniciar-sesion" replace />;
  if (role && user.role !== role) return <Navigate to="/panel" replace />;

  return <>{children}</>;
}
