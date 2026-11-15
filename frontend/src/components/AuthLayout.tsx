import type { ReactNode } from "react";
import { Flame, GraduationCap, Sparkles, Trophy } from "lucide-react";

const FEATURES = [
  { icon: GraduationCap, title: "Tu carrera, clara", text: "Materias, estados y notas en un solo lugar." },
  { icon: Sparkles, title: "Ganá XP y subí de nivel", text: "Cada materia aprobada te acerca a tu meta." },
  { icon: Flame, title: "Rachas que motivan", text: "Volvé cada día y sostené el hábito de estudiar." },
  { icon: Trophy, title: "Logros por desbloquear", text: "Celebrá cada hito de tu recorrido académico." },
];

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-indigo-600 to-sky-600" />
        <div className="absolute inset-0 bg-grid opacity-[0.18]" />
        <div className="absolute -right-24 top-24 size-72 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 size-72 rounded-full bg-sky-300/30 blur-3xl" />

        <div className="relative flex items-center gap-2.5 text-lg font-semibold">
          <span className="flex size-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <GraduationCap className="size-5" />
          </span>
          MetaUni
        </div>

        <div className="relative max-w-md space-y-6">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            Convertí tu carrera en un viaje que dan ganas de continuar.
          </h1>
          <p className="text-white/80">
            MetaUni es tu tracker académico gamificado: visualizá tu progreso, sumá XP y celeb­rá cada
            materia aprobada.
          </p>
          <ul className="space-y-3">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/12">
                  <feature.icon className="size-4.5" />
                </span>
                <span>
                  <span className="block text-sm font-medium">{feature.title}</span>
                  <span className="block text-sm text-white/70">{feature.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/60">Hecho para estudiantes que quieren ver su avance.</p>
      </aside>

      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
