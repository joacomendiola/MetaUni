import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  BookOpen,
  Flame,
  GraduationCap,
  Plus,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { levelTitle, type SubjectStatus } from "@metauni/shared";
import { useAuth } from "@/context/AuthContext";
import { useOverview } from "@/lib/queries";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { ProgressRing } from "@/components/ProgressRing";
import { EmptyState } from "@/components/EmptyState";
import { Loading } from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

const STATUS_COLORS: Record<SubjectStatus, string> = {
  PENDIENTE: "bg-slate-400",
  CURSANDO: "bg-sky-500",
  REGULAR: "bg-amber-500",
  APROBADA: "bg-emerald-500",
};

export function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useOverview();

  if (isLoading) return <Loading label="Cargando tu panel..." />;
  if (isError || !data) {
    return (
      <EmptyState
        title="No pudimos cargar tu panel"
        description="Revisa que el backend este corriendo e intenta de nuevo."
      />
    );
  }

  const firstName = user?.name.split(" ")[0] ?? "";
  const g = data.gamification;
  const hasCareers = data.totals.careers > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hola, ${firstName}`}
        description="Este es el resumen de tu recorrido academico."
      >
        <Button asChild variant="outline">
          <Link to="/carreras">
            <GraduationCap /> Mis carreras
          </Link>
        </Button>
        <Button asChild>
          <Link to="/carreras?nueva=1">
            <Plus /> Nueva carrera
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="relative overflow-hidden border-primary/20 lg:col-span-2">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/12 via-transparent to-sky-400/10" />
          <CardContent className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="space-y-2">
              <Badge variant="default" className="gap-1">
                <Sparkles className="size-3" /> Nivel {g.level} · {levelTitle(g.level)}
              </Badge>
              <p className="text-3xl font-semibold tracking-tight">{user?.xp ?? g.xp} XP</p>
              <p className="text-sm text-muted-foreground">
                Te faltan {g.xpToNextLevel} XP para subir al nivel {g.level + 1}.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-1 text-sm">
                <span className="inline-flex items-center gap-1.5 text-orange-500">
                  <Flame className="size-4" /> {g.streak} dias de racha
                </span>
                <span className="text-muted-foreground">Record: {g.longestStreak} dias</span>
              </div>
            </div>
            <ProgressRing value={g.levelProgress} size={124} stroke={11}>
              <span className="text-2xl font-semibold">{g.level}</span>
              <span className="text-[11px] text-muted-foreground">
                {g.xpIntoLevel}/{g.xpIntoLevel + g.xpToNextLevel} XP
              </span>
            </ProgressRing>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="flex h-full flex-col items-center justify-center gap-2 p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Progreso total</p>
            <ProgressRing value={data.progressPercent} size={140} stroke={12} color="var(--chart-3)">
              <span className="text-3xl font-semibold">{data.progressPercent}%</span>
              <span className="text-[11px] text-muted-foreground">
                {data.totals.approved} aprobadas
              </span>
            </ProgressRing>
            <p className="text-xs text-muted-foreground">{data.totals.subjects} materias cargadas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Progreso"
          value={`${data.progressPercent}%`}
          hint={`${data.totals.approved} de ${data.totals.subjects} aprobadas`}
          icon={<Target />}
          accent="var(--chart-1)"
        />
        <StatCard
          label="Promedio"
          value={data.averageGrade !== null ? data.averageGrade.toFixed(2) : "—"}
          hint="Promedio de aprobadas"
          icon={<Star />}
          accent="var(--chart-4)"
        />
        <StatCard
          label="Cursando"
          value={data.totals.inProgress + data.totals.regular}
          hint={`${data.totals.inProgress} cursando · ${data.totals.regular} regular`}
          icon={<BookOpen />}
          accent="var(--chart-2)"
        />
        <StatCard
          label="Aprobadas"
          value={data.totals.approved}
          hint={`${data.totals.pending} pendientes`}
          icon={<TrendingUp />}
          accent="var(--chart-3)"
        />
      </div>

      {!hasCareers ? (
        <EmptyState
          icon={<GraduationCap />}
          title="Todavia no cargaste tu carrera"
          description="Crea tu primera carrera o elegi una del catalogo para empezar a registrar materias y sumar XP."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild>
                <Link to="/carreras?nueva=1">
                  <Plus /> Crear carrera
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/carreras">Explorar catalogo</Link>
              </Button>
            </div>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Tus carreras</CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/carreras">
                    Ver todas <ArrowRight />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.careers.map((career) => (
                  <Link
                    key={career.id}
                    to={`/carreras/${career.id}`}
                    className="block rounded-xl border border-border/60 p-3 transition-colors hover:bg-accent/40"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="size-2.5 shrink-0 rounded-full" style={{ background: career.color }} />
                        <span className="truncate text-sm font-medium">{career.name}</span>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {career.approved}/{career.total} · {career.percent}%
                      </span>
                    </div>
                    <Progress
                      value={career.percent}
                      className="mt-2.5 h-2"
                      indicatorStyle={{ background: career.color }}
                    />
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Materias recientes</CardTitle>
              </CardHeader>
              <CardContent>
                {data.recentSubjects.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    Todavia no hay materias. Agrega la primera desde una carrera.
                  </p>
                ) : (
                  <ul className="divide-y divide-border/60">
                    {data.recentSubjects.map((subject) => (
                      <li key={subject.id} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{subject.name}</p>
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="size-1.5 rounded-full" style={{ background: subject.color }} />
                            {subject.careerName}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {subject.grade !== null ? (
                            <span className="text-xs font-medium text-muted-foreground">{subject.grade}</span>
                          ) : null}
                          <StatusBadge status={subject.status} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Materias por estado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.statusDistribution.map((item) => {
                  const total = Math.max(1, data.totals.subjects);
                  return (
                    <div key={item.status} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5">
                          <span className={`size-2 rounded-full ${STATUS_COLORS[item.status]}`} />
                          {item.label}
                        </span>
                        <span className="text-muted-foreground">{item.count}</span>
                      </div>
                      <Progress
                        value={(item.count / total) * 100}
                        className="h-1.5"
                        indicatorClassName={STATUS_COLORS[item.status]}
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribucion de notas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.gradeDistribution} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis
                        dataKey="range"
                        tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: "var(--accent)" }}
                        contentStyle={{
                          background: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: 12,
                          fontSize: 12,
                          color: "var(--popover-foreground)",
                        }}
                      />
                      <Bar dataKey="count" name="Materias" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Logros</CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/logros">
                    <Trophy /> Ver
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {data.achievements.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aproba tu primera materia para desbloquear tu primer logro.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {data.achievements.slice(0, 6).map((achievement) => (
                      <div
                        key={achievement.code}
                        className="flex items-center gap-1.5 rounded-full border border-border/70 bg-secondary/60 px-2.5 py-1 text-xs"
                        title={`${achievement.description} · ${formatDate(achievement.unlockedAt)}`}
                      >
                        <span>{achievement.icon}</span>
                        <span className="max-w-28 truncate">{achievement.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
