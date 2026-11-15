import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Loading({ label = "Cargando...", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground", className)}>
      <Loader2 className="size-6 animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function FullScreenLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Cargando MetaUni...</p>
      </div>
    </div>
  );
}
