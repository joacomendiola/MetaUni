import { useEffect, useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { levelFromXp, levelTitle, type PublicUser } from "@metauni/shared";
import { CalendarDays, Flame, Loader2, LogOut, Save, Shield, Sparkles, Trophy } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { ProgressRing } from "@/components/ProgressRing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { formatDate, initials } from "@/lib/utils";

export function Profile() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setEmail(user.email);
    setAvatarUrl(user.avatarUrl ?? "");
  }, [user]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        email: email.trim(),
        avatarUrl: avatarUrl.trim() || null,
      };
      if (password) payload.password = password;
      return (await api.patch<PublicUser>("/api/users/me", payload)).data;
    },
    onSuccess: (updated) => {
      updateUser(updated);
      setPassword("");
      toast.success("Perfil actualizado");
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  if (!user) return null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (password && password.length < 6) {
      toast.error("La contrasena debe tener al menos 6 caracteres");
      return;
    }
    mutation.mutate();
  };

  const handleLogout = async () => {
    await logout();
    navigate("/iniciar-sesion", { replace: true });
  };

  const xpInfo = levelFromXp(user.xp);

  return (
    <div className="space-y-6">
      <PageHeader title="Mi perfil" description="Administra tus datos y revisa tu progreso como estudiante.">
        <Button variant="outline" onClick={handleLogout}>
          <LogOut /> Cerrar sesion
        </Button>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Datos personales</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex size-16 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-xl font-semibold text-white">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={user.name} className="size-full object-cover" />
                  ) : (
                    initials(user.name)
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <Label htmlFor="avatar">URL de avatar (opcional)</Label>
                  <Input
                    id="avatar"
                    placeholder="https://..."
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="profile-name">Nombre</Label>
                  <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-email">Email</Label>
                  <Input
                    id="profile-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-password">Nueva contrasena (opcional)</Label>
                <Input
                  id="profile-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Dejar vacio para no cambiarla"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? <Loader2 className="animate-spin" /> : <Save />}
                  Guardar cambios
                </Button>
                <Badge variant="secondary" className="gap-1">
                  <Shield className="size-3" /> {user.role === "ADMIN" ? "Administrador" : "Estudiante"}
                </Badge>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tu progreso</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <ProgressRing value={xpInfo.progress} size={130} stroke={11}>
              <span className="text-3xl font-semibold">{user.level}</span>
              <span className="text-[11px] text-muted-foreground">Nivel</span>
            </ProgressRing>
            <div className="text-center">
              <p className="font-semibold">{levelTitle(user.level)}</p>
              <p className="text-sm text-muted-foreground">{user.xp} XP acumulados</p>
            </div>
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-orange-500">
                  <Flame className="size-3.5" /> Racha actual
                </span>
                <span className="font-medium">{user.streak} dias</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Sparkles className="size-3.5" /> Mejor racha
                </span>
                <span className="font-medium">{user.longestStreak} dias</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <CalendarDays className="size-3.5" /> En MetaUni desde
                </span>
                <span className="font-medium">{formatDate(user.createdAt)}</span>
              </div>
            </div>
            <Progress value={xpInfo.progress} className="h-1.5 w-full" />
            <Button asChild variant="secondary" className="w-full">
              <Link to="/logros">
                <Trophy /> Ver mis logros
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
