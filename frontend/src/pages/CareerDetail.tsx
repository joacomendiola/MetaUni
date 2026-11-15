import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  STATUS_LABELS,
  SUBJECT_STATUSES,
  progressPercent,
  type Subject,
  type SubjectStatus,
} from "@metauni/shared";
import {
  ArrowLeft,
  BookOpen,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { api, apiErrorMessage } from "@/lib/api";
import { queryKeys, useCareer } from "@/lib/queries";
import { useAuth } from "@/context/AuthContext";
import type { SubjectMutationResponse } from "@/lib/types";
import { effectiveTotal } from "@/lib/career-utils";
import { CareerDialog } from "@/components/CareerDialog";
import { SubjectDialog } from "@/components/SubjectDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { ProgressRing } from "@/components/ProgressRing";
import { EmptyState } from "@/components/EmptyState";
import { Loading } from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const STATUS_DOT: Record<SubjectStatus, string> = {
  PENDIENTE: "bg-slate-400",
  CURSANDO: "bg-sky-500",
  REGULAR: "bg-amber-500",
  APROBADA: "bg-emerald-500",
};

export function CareerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { updateUser } = useAuth();
  const { data: career, isLoading, isError } = useCareer(id);

  const [editOpen, setEditOpen] = useState(false);
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null);
  const [deleteCareerOpen, setDeleteCareerOpen] = useState(false);

  const statusMutation = useMutation({
    mutationFn: async ({ subjectId, status }: { subjectId: string; status: SubjectStatus }) =>
      (
        await api.patch<SubjectMutationResponse>(`/api/subjects/${subjectId}`, { status })
      ).data,
    onSuccess: (data) => {
      updateUser(data.user);
      if (id) queryClient.invalidateQueries({ queryKey: queryKeys.career(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.careers });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview });
      toast.success("Estado actualizado");
      for (const unlocked of data.unlocked) {
        toast.success(`${unlocked.icon} Logro desbloqueado: ${unlocked.name}`, {
          description: `${unlocked.description} (+${unlocked.xpReward} XP)`,
        });
      }
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: async (subjectId: string) => (await api.delete(`/api/subjects/${subjectId}`)).data,
    onSuccess: (data: { user?: SubjectMutationResponse["user"] }) => {
      if (data.user) updateUser(data.user);
      if (id) queryClient.invalidateQueries({ queryKey: queryKeys.career(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.careers });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview });
      toast.success("Materia eliminada");
      setDeletingSubject(null);
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const deleteCareerMutation = useMutation({
    mutationFn: async () => (await api.delete(`/api/careers/${id}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.careers });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview });
      toast.success("Carrera eliminada");
      navigate("/carreras", { replace: true });
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const grouped = useMemo(() => {
    if (!career?.subjects) return [];
    const map = new Map<number, Subject[]>();
    for (const subject of career.subjects) {
      const list = map.get(subject.year) ?? [];
      list.push(subject);
      map.set(subject.year, list);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [career]);

  if (isLoading) return <Loading label="Cargando carrera..." />;
  if (isError || !career) {
    return (
      <EmptyState
        icon={<BookOpen />}
        title="Carrera no encontrada"
        description="Puede que la hayas eliminado o no tengas acceso."
        action={
          <Button asChild variant="outline">
            <Link to="/carreras">
              <ArrowLeft /> Volver a carreras
            </Link>
          </Button>
        }
      />
    );
  }

  const subjects = career.subjects ?? [];
  const total = effectiveTotal(career.totalSubjects, subjects.length);
  const approved = subjects.filter((s) => s.status === "APROBADA").length;
  const percent = progressPercent(approved, total);
  const grades = subjects.filter((s) => s.status === "APROBADA" && s.grade !== null).map((s) => s.grade as number);
  const average = grades.length ? grades.reduce((a, b) => a + b, 0) / grades.length : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/carreras">
            <ArrowLeft /> Carreras
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil /> Editar
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteCareerOpen(true)}>
            <Trash2 /> Eliminar
          </Button>
        </div>
      </div>

      <Card className="relative overflow-hidden">
        <div className="h-1.5 w-full" style={{ background: career.color }} />
        <CardContent className="flex flex-col gap-6 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{career.name}</h1>
              {career.faculty ? <Badge variant="secondary">{career.faculty}</Badge> : null}
            </div>
            {career.description ? <p className="max-w-xl text-sm text-muted-foreground">{career.description}</p> : null}
            <div className="flex flex-wrap items-center gap-4 pt-1 text-sm text-muted-foreground">
              <span>
                <strong className="font-semibold text-foreground">{approved}</strong> aprobadas
              </span>
              <span>
                <strong className="font-semibold text-foreground">{subjects.length}</strong> cargadas
              </span>
              <span>
                <strong className="font-semibold text-foreground">{total}</strong> totales
              </span>
              <span>
                Promedio{" "}
                <strong className="font-semibold text-foreground">
                  {average !== null ? average.toFixed(2) : "—"}
                </strong>
              </span>
            </div>
            <Progress
              value={percent}
              className="mt-2 h-2.5 max-w-md"
              indicatorStyle={{ background: career.color }}
            />
          </div>
          <ProgressRing value={percent} size={128} stroke={11} color={career.color}>
            <span className="text-2xl font-semibold">{percent}%</span>
            <span className="text-[11px] text-muted-foreground">completado</span>
          </ProgressRing>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Materias</h2>
        <Button onClick={() => setSubjectDialogOpen(true)}>
          <Plus /> Nueva materia
        </Button>
      </div>

      {subjects.length === 0 ? (
        <EmptyState
          icon={<BookOpen />}
          title="No hay materias todavia"
          description="Agrega tus materias para empezar a seguir el progreso de esta carrera."
          action={
            <Button onClick={() => setSubjectDialogOpen(true)}>
              <Plus /> Agregar materia
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {grouped.map(([year, items]) => (
            <div key={year} className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {year}° ano
                </h3>
                <span className="text-xs text-muted-foreground">({items.length})</span>
              </div>
              <div className="space-y-2">
                {items.map((subject) => (
                  <Card key={subject.id}>
                    <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={`size-2.5 shrink-0 rounded-full ${STATUS_DOT[subject.status]}`} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{subject.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {subject.term ? `${subject.term}° cuatrimestre` : "Anual"}
                            {subject.credits ? ` · ${subject.credits} creditos` : ""}
                            {subject.grade !== null ? ` · Nota ${subject.grade}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2 sm:justify-end">
                        <StatusBadge status={subject.status} />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="iconSm" aria-label="Opciones de materia">
                              {statusMutation.isPending && statusMutation.variables?.subjectId === subject.id ? (
                                <Loader2 className="animate-spin" />
                              ) : (
                                <MoreHorizontal />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Cambiar estado</DropdownMenuLabel>
                            {SUBJECT_STATUSES.map((status) => (
                              <DropdownMenuItem
                                key={status}
                                disabled={status === subject.status}
                                onClick={() => statusMutation.mutate({ subjectId: subject.id, status })}
                              >
                                <span className={`size-2 rounded-full ${STATUS_DOT[status]}`} />
                                {STATUS_LABELS[status]}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingSubject(subject);
                                setSubjectDialogOpen(true);
                              }}
                            >
                              <Pencil /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeletingSubject(subject)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <CareerDialog open={editOpen} onOpenChange={setEditOpen} career={career} />
      <SubjectDialog
        open={subjectDialogOpen}
        onOpenChange={(open) => {
          setSubjectDialogOpen(open);
          if (!open) setEditingSubject(null);
        }}
        careerId={career.id}
        subject={editingSubject ?? undefined}
      />
      <ConfirmDialog
        open={Boolean(deletingSubject)}
        onOpenChange={(open) => !open && setDeletingSubject(null)}
        title="Eliminar materia"
        description={`Se eliminara "${deletingSubject?.name}" y se descontara la XP asociada.`}
        confirmLabel="Eliminar"
        loading={deleteSubjectMutation.isPending}
        onConfirm={() => deletingSubject && deleteSubjectMutation.mutate(deletingSubject.id)}
      />
      <ConfirmDialog
        open={deleteCareerOpen}
        onOpenChange={setDeleteCareerOpen}
        title="Eliminar carrera"
        description={`Se eliminaran "${career.name}" y todas sus materias. Esta accion no se puede deshacer.`}
        confirmLabel="Eliminar carrera"
        loading={deleteCareerMutation.isPending}
        onConfirm={() => deleteCareerMutation.mutate()}
      />
    </div>
  );
}
