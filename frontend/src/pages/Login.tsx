import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { AuthLayout } from "@/components/AuthLayout";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/panel" replace />;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success("Bienvenido de vuelta");
      navigate("/panel", { replace: true });
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = () => {
    setEmail("demo@metauni.app");
    setPassword("demo123");
  };

  const fillAdmin = () => {
    setEmail("admin@metauni.app");
    setPassword("admin123");
  };

  return (
    <AuthLayout>
      <div className="mb-8 lg:hidden">
        <Logo to="/iniciar-sesion" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Iniciar sesion</h2>
        <p className="text-sm text-muted-foreground">
          Entrá para ver el progreso de tu carrera y seguir sumando XP.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="vos@universidad.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contrasena</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
          {submitting ? <Loader2 className="animate-spin" /> : <LogIn />}
          {submitting ? "Ingresando..." : "Ingresar"}
        </Button>
      </form>

      <div className="mt-5 rounded-xl border border-dashed border-border bg-card/50 p-3 text-sm">
        <p className="font-medium">Cuentas de prueba</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={fillDemo}>
            Estudiante demo
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={fillAdmin}>
            Administrador
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">demo@metauni.app / demo123 · admin@metauni.app / admin123</p>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Todavia no tenes cuenta?{" "}
        <Link to="/registrarse" className="font-medium text-primary hover:underline">
          Crear una cuenta
        </Link>
      </p>
    </AuthLayout>
  );
}
