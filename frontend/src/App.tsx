import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { FullScreenLoading } from "@/components/Loading";
import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Login } from "@/pages/Login";
import { Register } from "@/pages/Register";
import { Dashboard } from "@/pages/Dashboard";
import { Careers } from "@/pages/Careers";
import { CareerDetail } from "@/pages/CareerDetail";
import { Profile } from "@/pages/Profile";
import { Achievements } from "@/pages/Achievements";
import { Admin } from "@/pages/Admin";
import { NotFound } from "@/pages/NotFound";

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoading />;
  return <Navigate to={user ? "/panel" : "/iniciar-sesion"} replace />;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/iniciar-sesion" element={<Login />} />
      <Route path="/registrarse" element={<Register />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/panel" element={<Dashboard />} />
        <Route path="/carreras" element={<Careers />} />
        <Route path="/carreras/:id" element={<CareerDetail />} />
        <Route path="/logros" element={<Achievements />} />
        <Route path="/perfil" element={<Profile />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="ADMIN">
              <Admin />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
