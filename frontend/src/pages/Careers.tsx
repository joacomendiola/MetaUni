import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Career } from "@metauni/shared";
import { ArrowRight, BookOpen, GraduationCap, Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, apiErrorMessage } from "@/lib/api";
import { queryKeys, useCareers, useCatalog, type CatalogCareer } from "@/lib/queries";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Loading } from "@/components/Loading";
import { CareerDialog } from "@/components/CareerDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ProgressRing } from "@/components/ProgressRing";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Careers() {
  const [params, setParams] = useSearchParams();
  const { data: careers, isLoading } = useCareers();
  const { data: catalog } = useCatalog();
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(params.get("nueva") === "1");
  const [editCareer, setEditCareer] = useState<Career | null>(null);
  const [deleteCareer, setDeleteCareer] = useState<Career | null>(null);

  useEffect(() => {
    if (params.get("nueva") === "1") {
      const next = new URLSearchParams(params);
      next.delete("nueva");
      setParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/api/careers/${id}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.careers });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview });
      toast.success("Carrera eliminada");
      setDeleteCareer(null);
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const cloneMutation = useMutation({
    mutationFn: async (id: string) => (await api.post<Career>(`/api/careers/from-catalog/${id}`)).data,
    onSuccess: (career) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.careers });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview });
      toast.success(`"${career.name}" agregada a tus carreras`);
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Mis carreras" description="Gestiona tus carreras y su avance.">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus /> Nueva carrera
        </Button>
      </PageHeader>

      {isLoading ? (
        <Loading label="Cargando carreras..." />
      ) : !careers || careers.length === 0 ? (
        <EmptyState
          icon={<GraduationCap />}
          title="Todavia no tenes carreras"
          description="Crea tu primera carrera o elegi una del catalogo para empezar."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus /> Crear carrera
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {careers.map((career) => {
            const total = career.progress?.total ?? 0;
            const approved = career.progress?.approved ?? 0;
            const percent = career.progress?.percent ?? 0;
            return (
              <Card key={career.id} className="group relative overflow-hidden">
                <div className="h-1.5 w-full" style={{ background: career.color }} />
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link to={`/carreras/${career.id}`} className="block truncate font-semibold hover:underline">
                        {career.name}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">
                        {career.faculty || "Sin facultad"}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="iconSm" aria-label="Opciones">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditCareer(career)}>
                          <Pencil /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteCareer(career)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center gap-4">
                    <ProgressRing value={percent} size={78} stroke={8} color={career.color}>
                      <span className="text-sm font-semibold">{percent}%</span>
                    </ProgressRing>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{approved} aprobadas</span>
                        <span>{total} total</span>
                      </div>
                      <Progress value={percent} className="h-2" indicatorStyle={{ background: career.color }} />
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <BookOpen className="size-3.5" /> {career.subjects?.length ?? approved} materias cargadas
                      </p>
                    </div>
                  </div>

                  <Button asChild variant="secondary" className="w-full">
                    <Link to={`/carreras/${career.id}`}>
                      Abrir carrera <ArrowRight />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Catalogo de carreras</h2>
            <p className="text-sm text-muted-foreground">
              Plantillas oficiales listas para agregar a tu cuenta con un clic.
            </p>
          </div>
        </div>
        {!catalog || catalog.length === 0 ? (
          <EmptyState icon={<GraduationCap />} title="Catalogo vacio" description="Un administrador puede cargar carreras al catalogo." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {catalog.map((item: CatalogCareer) => (
              <Card key={item.id} className="flex flex-col">
                <CardContent className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ background: item.color }} />
                    <p className="truncate font-medium">{item.name}</p>
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {item.description || "Carrera de catalogo MetaUni."}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {item.faculty ? <Badge variant="secondary">{item.faculty}</Badge> : null}
                    <Badge variant="muted">{item.subjectCount} materias</Badge>
                  </div>
                  <Button
                    variant="outline"
                    className="mt-auto w-full"
                    onClick={() => cloneMutation.mutate(item.id)}
                    disabled={cloneMutation.isPending && cloneMutation.variables === item.id}
                  >
                    {cloneMutation.isPending && cloneMutation.variables === item.id ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Plus />
                    )}
                    Agregar a mis carreras
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CareerDialog open={createOpen} onOpenChange={setCreateOpen} />
      <CareerDialog
        open={Boolean(editCareer)}
        onOpenChange={(open) => !open && setEditCareer(null)}
        career={editCareer ?? undefined}
      />
      <ConfirmDialog
        open={Boolean(deleteCareer)}
        onOpenChange={(open) => !open && setDeleteCareer(null)}
        title="Eliminar carrera"
        description={`Se eliminaran "${deleteCareer?.name}" y todas sus materias. Esta accion no se puede deshacer.`}
        confirmLabel="Eliminar"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteCareer && deleteMutation.mutate(deleteCareer.id)}
      />
    </div>
  );
}
