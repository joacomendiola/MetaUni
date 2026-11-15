import { ACHIEVEMENT_DEFINITIONS } from "@metauni/shared";
import { Lock, Sparkles, Trophy } from "lucide-react";
import { useAchievements } from "@/lib/queries";
import { PageHeader } from "@/components/PageHeader";
import { Loading } from "@/components/Loading";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export function Achievements() {
  const { data: unlocked, isLoading } = useAchievements();

  if (isLoading) return <Loading label="Cargando logros..." />;

  const unlockedMap = new Map((unlocked ?? []).map((item) => [item.code, item]));
  const unlockedCount = unlockedMap.size;
  const total = ACHIEVEMENT_DEFINITIONS.length;
  const xpEarned = (unlocked ?? []).reduce((acc, item) => acc + item.xpReward, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Logros"
        description="Cada hito de tu carrera desbloquea recompensas. Segui avanzando."
      />

      <Card>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Trophy className="size-6" />
            </span>
            <div>
              <p className="text-2xl font-semibold">
                {unlockedCount}
                <span className="text-base font-normal text-muted-foreground"> / {total} desbloqueados</span>
              </p>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="size-3.5" /> {xpEarned} XP ganados con logros
              </p>
            </div>
          </div>
          <div className="w-full sm:max-w-xs">
            <Progress value={(unlockedCount / total) * 100} className="h-2.5" />
            <p className="mt-1.5 text-right text-xs text-muted-foreground">
              {Math.round((unlockedCount / total) * 100)}% completado
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ACHIEVEMENT_DEFINITIONS.map((definition) => {
          const unlockedItem = unlockedMap.get(definition.code);
          const isUnlocked = Boolean(unlockedItem);
          return (
            <Card
              key={definition.code}
              className={
                isUnlocked
                  ? "border-primary/30 bg-gradient-to-br from-primary/10 to-transparent"
                  : "opacity-80"
              }
            >
              <CardContent className="flex items-start gap-3 p-4">
                <span
                  className={
                    isUnlocked
                      ? "flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-2xl"
                      : "flex size-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-2xl grayscale"
                  }
                >
                  {isUnlocked ? definition.icon : <Lock className="size-5 text-muted-foreground" />}
                </span>
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{definition.name}</p>
                    <Badge variant={isUnlocked ? "default" : "muted"}>
                      +{definition.xpReward} XP
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{definition.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {isUnlocked && unlockedItem
                      ? `Desbloqueado el ${formatDate(unlockedItem.unlockedAt)}`
                      : "Bloqueado"}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
