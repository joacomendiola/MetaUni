import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Career } from "@metauni/shared";
import {
  BookOpen,
  GraduationCap,
  Layers,
  Loader2,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { api, apiErrorMessage } from "@/lib/api";
import {
  queryKeys,
  useAdminCareers,
  useAdminOverview,
  useAdminUsers,
  type AdminUser,
  type CatalogCareer,
} from "@/lib/queries";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Loading } from "@/components/Loading";
import { EmptyState } from "@/components/EmptyState";
import { CareerDialog } from "@/components/CareerDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Tab = "users" | "catalog";

export function Admin() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: overview, isLoading: loadingOverview } = useAdminOverview();
  const { data: users, isLoading: loadingUsers } = useAdminUsers();
  const { data: careers, isLoading: loadingCareers } = useAdminCareers();

  const [tab, setTab] = useState<Tab>("users");
  const [createOpen, setCreateOpen] = useState(false);
  const [editCareer, setEditCareer] = useState<Career | null>(null);
  const [deleteCareer, setDeleteCareer] = useState<CatalogCareer | null>(null);
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);
  const [manageCareerId, setManageCareerId] = useState<string | null>(null);
  const [subjectName, setSubjectName] = useState("");
  const [subjectYear, setSubjectYear] = useState("1");

  const managedCareer = careers?.find((c) => c.id === manageCareerId) ?? null;

  const roleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: "STUDENT" | "ADMIN" }) =>
      (await api.patch(`/api/admin/users/${id}`, { role })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers });
      toast.success("Rol actualizado");
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/api/admin/users/${id}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminOverview });
      toast.success("Usuario eliminado");
      setDeleteUser(null);
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const deleteCareerMutation = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/api/admin/careers/${id}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminCareers });
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminOverview });
      toast.success("Carrera de catalogo eliminada");
      setDeleteCareer(null);
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const addSubjectMutation = useMutation({
    mutationFn: async ({ careerId, name, year }: { careerId: string; name: string; year: number }) =>
      (await api.post(`/api/admin/careers/${careerId}/subjects`, { name, year })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminCareers });
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog });
      setSubjectName("");
      toast.success("Materia agregada al catalogo");
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/api/admin/subjects/${id}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminCareers });
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog });
      toast.success("Materia eliminada");
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const handleAddSubject = (event: FormEvent) => {
    event.preventDefault();
    if (!managedCareer || !subjectName.trim()) return;
    addSubjectMutation.mutate({
      careerId: managedCareer.id,
      name: subjectName.trim(),
      year: Number(subjectYear) || 1,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Panel de administracion"
        description="Gestiona usuarios y el catalogo de carreras de MetaUni."
      >
        <Badge variant="default" className="gap-1">
          <ShieldCheck className="size-3.5" /> Administrador
        </Badge>
      </PageHeader>

      {loadingOverview ? (
        <Loading label="Cargando metricas..." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          <StatCard label="Usuarios" value={overview?.users ?? 0} icon={<Users />} accent="var(--chart-1)" />
          <StatCard label="Carreras" value={overview?.personalCareers ?? 0} icon={<GraduationCap />} accent="var(--chart-2)" />
          <StatCard label="Catalogo" value={overview?.catalogCareers ?? 0} icon={<Layers />} accent="var(--chart-3)" />
          <StatCard label="Materias" value={overview?.subjects ?? 0} icon={<BookOpen />} accent="var(--chart-4)" />
          <StatCard label="Aprobadas" value={overview?.approved ?? 0} icon={<GraduationCap />} accent="var(--chart-5)" />
        </div>
      )}

      <div className="inline-flex rounded-xl border border-border bg-secondary/50 p-1">
        <button
          onClick={() => setTab("users")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            tab === "users" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
          )}
        >
          <Users className="size-4" /> Usuarios
        </button>
        <button
          onClick={() => setTab("catalog")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            tab === "catalog" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
          )}
        >
          <Layers className="size-4" /> Catalogo
        </button>
      </div>

      {tab === "users" ? (
        <Card>
          <CardHeader>
            <CardTitle>Usuarios registrados</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingUsers ? (
              <Loading label="Cargando usuarios..." />
            ) : !users || users.length === 0 ? (
              <EmptyState title="Sin usuarios" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-border/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-3 font-medium sm:px-5">Usuario</th>
                      <th className="px-4 py-3 font-medium">Rol</th>
                      <th className="px-4 py-3 font-medium">Carreras</th>
                      <th className="px-4 py-3 font-medium">Materias</th>
                      <th className="px-4 py-3 font-medium">Nivel</th>
                      <th className="px-4 py-3 text-right font-medium sm:px-5">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {users.map((item) => (
                      <tr key={item.id} className="hover:bg-accent/30">
                        <td className="px-4 py-3 sm:px-5">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Select
                            value={item.role}
                            className="h-8 w-32 text-xs"
                            onChange={(e) =>
                              roleMutation.mutate({
                                id: item.id,
                                role: e.target.value as "STUDENT" | "ADMIN",
                              })
                            }
                            disabled={roleMutation.isPending || item.id === user?.id}
                          >
                            <option value="STUDENT">Estudiante</option>
                            <option value="ADMIN">Admin</option>
                          </Select>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{item.careers}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {item.approved}/{item.subjects}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary">Nv. {item.level}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right sm:px-5">
                          <Button
                            variant="ghost"
                            size="iconSm"
                            onClick={() => setDeleteUser(item)}
                            disabled={item.id === user?.id}
                            aria-label="Eliminar usuario"
                            className="text-destructive"
                          >
                            <Trash2 />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Catalogo de carreras</h2>
              <p className="text-sm text-muted-foreground">Plantillas disponibles para los estudiantes.</p>
            </div>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus /> Nueva carrera
            </Button>
          </div>

          {loadingCareers ? (
            <Loading label="Cargando catalogo..." />
          ) : !careers || careers.length === 0 ? (
            <EmptyState
              icon={<Layers />}
              title="Catalogo vacio"
              description="Crea la primera carrera de catalogo para que los estudiantes puedan agregarla."
              action={
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus /> Crear carrera
                </Button>
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {careers.map((career) => (
                <Card key={career.id}>
                  <div className="h-1.5 w-full" style={{ background: career.color }} />
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{career.name}</p>
                        <p className="text-xs text-muted-foreground">{career.faculty || "Sin facultad"}</p>
                      </div>
                      <Badge variant="muted">{career.subjectCount} materias</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" size="sm" onClick={() => setManageCareerId(career.id)}>
                        <BookOpen /> Materias
                      </Button>
                      <Button variant="ghost" size="iconSm" onClick={() => setEditCareer(career)} aria-label="Editar">
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="iconSm"
                        onClick={() => setDeleteCareer(career)}
                        aria-label="Eliminar"
                        className="text-destructive"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <CareerDialog open={createOpen} onOpenChange={setCreateOpen} catalog />
      <CareerDialog
        open={Boolean(editCareer)}
        onOpenChange={(open) => !open && setEditCareer(null)}
        career={editCareer ?? undefined}
        catalog
      />
      <ConfirmDialog
        open={Boolean(deleteCareer)}
        onOpenChange={(open) => !open && setDeleteCareer(null)}
        title="Eliminar carrera de catalogo"
        description={`Se eliminara "${deleteCareer?.name}" del catalogo. Las copias personales de los estudiantes no se veran afectadas.`}
        confirmLabel="Eliminar"
        loading={deleteCareerMutation.isPending}
        onConfirm={() => deleteCareer && deleteCareerMutation.mutate(deleteCareer.id)}
      />
      <ConfirmDialog
        open={Boolean(deleteUser)}
        onOpenChange={(open) => !open && setDeleteUser(null)}
        title="Eliminar usuario"
        description={`Se eliminara la cuenta de "${deleteUser?.name}" y todos sus datos. Esta accion no se puede deshacer.`}
        confirmLabel="Eliminar usuario"
        loading={deleteUserMutation.isPending}
        onConfirm={() => deleteUser && deleteUserMutation.mutate(deleteUser.id)}
      />

      <Dialog open={Boolean(manageCareerId)} onOpenChange={(open) => !open && setManageCareerId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Materias de {managedCareer?.name}</DialogTitle>
            <DialogDescription>
              Estas materias se copian como pendientes cuando un estudiante agrega la carrera.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {!managedCareer || (managedCareer.subjects?.length ?? 0) === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                Sin materias todavia.
              </p>
            ) : (
              managedCareer.subjects?.map((subject) => (
                <div
                  key={subject.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border/70 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm">{subject.name}</p>
                    <p className="text-xs text-muted-foreground">{subject.year}° ano</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="iconSm"
                    className="text-destructive"
                    onClick={() => deleteSubjectMutation.mutate(subject.id)}
                    aria-label="Eliminar materia"
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAddSubject} className="space-y-3 border-t border-border/70 pt-4">
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="catalog-subject">Nueva materia</Label>
                <Input
                  id="catalog-subject"
                  placeholder="Programacion I"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="catalog-year">Ano</Label>
                <Input
                  id="catalog-year"
                  type="number"
                  min={1}
                  max={10}
                  className="w-20"
                  value={subjectYear}
                  onChange={(e) => setSubjectYear(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setManageCareerId(null)}>
                Cerrar
              </Button>
              <Button type="submit" disabled={addSubjectMutation.isPending || !subjectName.trim()}>
                {addSubjectMutation.isPending ? <Loader2 className="animate-spin" /> : <Plus />}
                Agregar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
