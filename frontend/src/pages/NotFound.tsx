import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <Logo />
      <div className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
        <Compass className="size-7" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Pagina no encontrada</h1>
        <p className="text-sm text-muted-foreground">La ruta que buscas no existe o fue movida.</p>
      </div>
      <Button asChild>
        <Link to="/panel">Volver al panel</Link>
      </Button>
    </div>
  );
}
