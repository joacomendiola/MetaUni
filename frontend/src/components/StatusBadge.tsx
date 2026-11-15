import { type SubjectStatus, STATUS_LABELS } from "@metauni/shared";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const VARIANTS: Record<SubjectStatus, "muted" | "info" | "warning" | "success"> = {
  PENDIENTE: "muted",
  CURSANDO: "info",
  REGULAR: "warning",
  APROBADA: "success",
};

const DOTS: Record<SubjectStatus, string> = {
  PENDIENTE: "bg-slate-400",
  CURSANDO: "bg-sky-500",
  REGULAR: "bg-amber-500",
  APROBADA: "bg-emerald-500",
};

export function StatusBadge({ status, className }: { status: SubjectStatus; className?: string }) {
  return (
    <Badge variant={VARIANTS[status]} className={cn("gap-1.5", className)}>
      <span className={cn("size-1.5 rounded-full", DOTS[status])} />
      {STATUS_LABELS[status]}
    </Badge>
  );
}
