import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  STATUS_LABELS,
  SUBJECT_STATUSES,
  type PublicUser,
  type Subject,
  type SubjectStatus,
} from "@metauni/shared";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, apiErrorMessage } from "@/lib/api";
import { queryKeys } from "@/lib/queries";
import { useAuth } from "@/context/AuthContext";
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
import { Select } from "@/components/ui/select";

interface UnlockedAchievement {
  code: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
}

interface SubjectMutationResponse {
  subject: Subject;
  user: PublicUser;
  unlocked: UnlockedAchievement[];
}

interface SubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  careerId: string;
  subject?: Subject;
}

interface FormState {
  name: string;
  year: string;
  term: string;
  credits: string;
  status: SubjectStatus;
  grade: string;
  notes: string;
}

const EMPTY: FormState = {
  name: "",
  year: "1",
  term: "",
  credits: "",
  status: "PENDIENTE",
  grade: "",
  notes: "",
};

export function SubjectDialog({ open, onOpenChange, careerId, subject }: SubjectDialogProps) {
  const queryClient = useQueryClient();
  const { updateUser } = useAuth();
  const [form, setForm] = useState<FormState>(EMPTY);

  useEffect(() => {
    if (!open) return;
    setForm(
      subject
        ? {
            name: subject.name,
            year: String(subject.year),
            term: subject.term ? String(subject.term) : "",
            credits: subject.credits !== null ? String(subject.credits) : "",
            status: subject.status,
            grade: subject.grade !== null ? String(subject.grade) : "",
            notes: subject.notes ?? "",
          }
        : EMPTY,
    );
  }, [open, subject]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        year: Number(form.year) || 1,
        term: form.term ? Number(form.term) : null,
        credits: form.credits ? Number(form.credits) : null,
        status: form.status,
        grade: form.grade !== "" ? Number(form.grade) : null,
        notes: form.notes.trim() || null,
      };
      if (subject) {
        return (await api.patch<SubjectMutationResponse>(`/api/subjects/${subject.id}`, payload)).data;
      }
      return (await api.post<SubjectMutationResponse>(`/api/careers/${careerId}/subjects`, payload)).data;
    },
    onSuccess: (data) => {
      updateUser(data.user);
      queryClient.invalidateQueries({ queryKey: queryKeys.career(careerId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.careers });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview });
      queryClient.invalidateQueries({ queryKey: queryKeys.achievements });
      toast.success(subject ? "Materia actualizada" : "Materia agregada");
      for (const unlocked of data.unlocked) {
        toast.success(`${unlocked.icon} Logro desbloqueado: ${unlocked.name}`, {
          description: `${unlocked.description} (+${unlocked.xpReward} XP)`,
        });
      }
      onOpenChange(false);
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{subject ? "Editar materia" : "Nueva materia"}</DialogTitle>
          <DialogDescription>
            El estado y la nota definen cuanta XP suma esta materia a tu progreso.
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
            <Label htmlFor="subject-name">Nombre</Label>
            <Input
              id="subject-name"
              placeholder="Programacion I"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="subject-year">Ano</Label>
              <Input
                id="subject-year"
                type="number"
                min={1}
                max={10}
                value={form.year}
                onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject-term">Cuatrimestre</Label>
              <Select
                id="subject-term"
                value={form.term}
                onChange={(e) => setForm((f) => ({ ...f, term: e.target.value }))}
              >
                <option value="">Anual</option>
                <option value="1">1ro</option>
                <option value="2">2do</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject-credits">Creditos</Label>
              <Input
                id="subject-credits"
                type="number"
                min={0}
                max={50}
                value={form.credits}
                onChange={(e) => setForm((f) => ({ ...f, credits: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject-grade">Nota</Label>
              <Input
                id="subject-grade"
                type="number"
                min={0}
                max={10}
                step="0.01"
                placeholder="0-10"
                value={form.grade}
                onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject-status">Estado</Label>
            <Select
              id="subject-status"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as SubjectStatus }))}
            >
              {SUBJECT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject-notes">Notas</Label>
            <Textarea
              id="subject-notes"
              placeholder="Observaciones, profesor, fechas..."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="animate-spin" /> : null}
              {subject ? "Guardar cambios" : "Agregar materia"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
