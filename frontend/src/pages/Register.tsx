import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { AuthLayout } from "@/components/AuthLayout";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/panel" replace />;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (password.length < 6) {
      toast.error("La contrasena debe tener al menos 6 caracteres");
      return;
    }
    setSubmitting(true);
    try {
      await register(name, email, password);
      toast.success("Cuenta creada. Empecemos tu recorrido!");
      navigate("/panel", { replace: true });
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-8 lg:hidden">
        <Logo to="/iniciar-sesion" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Crear cuenta</h2>
        <p className="text-sm text-muted-foreground">
          Empezá a trackear tu carrera y desbloqueá logros mientras avanzás.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            autoComplete="name"
            placeholder="Tu nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
          />
        </div>
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
            autoComplete="new-password"
            placeholder="Minimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
          {submitting ? <Loader2 className="animate-spin" /> : <UserPlus />}
          {submitting ? "Creando cuenta..." : "Crear cuenta"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Ya tenes cuenta?{" "}
        <Link to="/iniciar-sesion" className="font-medium text-primary hover:underline">
          Iniciar sesion
        </Link>
      </p>
    </AuthLayout>
  );
}
