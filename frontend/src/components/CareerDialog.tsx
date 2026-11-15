import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Career } from "@metauni/shared";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, apiErrorMessage } from "@/lib/api";
import { queryKeys } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ColorPicker } from "@/components/ColorPicker";

interface CareerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  career?: Career;
  catalog?: boolean;
}

const EMPTY = {
  name: "",
  faculty: "",
  description: "",
  totalSubjects: "0",
  color: "#6366f1",
};

export function CareerDialog({ open, onOpenChange, career, catalog = false }: CareerDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!open) return;
    setForm(
      career
        ? {
            name: career.name,
            faculty: career.faculty ?? "",
            description: career.description ?? "",
            totalSubjects: String(career.totalSubjects),
            color: career.color,
          }
        : EMPTY,
    );
  }, [open, career]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        faculty: form.faculty.trim() || null,
        description: form.description.trim() || null,
        totalSubjects: Number(form.totalSubjects) || 0,
        color: form.color,
      };
      const base = catalog ? "/api/admin/careers" : "/api/careers";
      if (career) {
        return (await api.patch<Career>(`${base}/${career.id}`, payload)).data;
      }
      return (await api.post<Career>(base, payload)).data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.careers });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview });
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminCareers });
      if (career) {
        queryClient.invalidateQueries({ queryKey: queryKeys.career(career.id) });
        toast.success("Carrera actualizada");
      } else {
        queryClient.invalidateQueries({ queryKey: queryKeys.career(data.id) });
        toast.success("Carrera creada");
      }
      onOpenChange(false);
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {career ? "Editar carrera" : catalog ? "Nueva carrera de catalogo" : "Nueva carrera"}
          </DialogTitle>
          <DialogDescription>
            {career
              ? "Ajusta los datos de la carrera."
              : catalog
                ? "Las carreras de catalogo son plantillas que cualquier estudiante puede agregar."
                : "Crea una carrera para empezar a cargar tus materias y ver tu progreso."}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!form.name.trim()) {
              toast.error("El nombre es obligatorio");
              return;
            }
            mutation.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="career-name">Nombre</Label>
            <Input
              id="career-name"
              placeholder="Ingenieria en Sistemas"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="career-faculty">Facultad</Label>
              <Input
                id="career-faculty"
                placeholder="Ingenieria"
                value={form.faculty}
                onChange={(e) => setForm((f) => ({ ...f, faculty: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="career-total">Total de materias</Label>
              <Input
                id="career-total"
                type="number"
                min={0}
                max={500}
                value={form.totalSubjects}
                onChange={(e) => setForm((f) => ({ ...f, totalSubjects: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="career-description">Descripcion</Label>
            <Textarea
              id="career-description"
              placeholder="Notas, orientacion, plan..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Color de la carrera</Label>
            <ColorPicker value={form.color} onChange={(color) => setForm((f) => ({ ...f, color }))} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="animate-spin" /> : null}
              {career ? "Guardar cambios" : "Crear carrera"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
