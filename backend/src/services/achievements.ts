import type { PrismaClient } from "@prisma/client";
import { ACHIEVEMENT_DEFINITIONS, levelFromXp, type AchievementCode } from "@metauni/shared";

export interface UnlockedAchievement {
  code: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
}

function effectiveTotal(totalSubjects: number, subjectCount: number): number {
  return totalSubjects > 0 ? totalSubjects : subjectCount;
}

export async function evaluateAchievements(
  prisma: PrismaClient,
  userId: string,
): Promise<UnlockedAchievement[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      achievements: { include: { achievement: true } },
      careers: { include: { subjects: true } },
    },
  });
  if (!user) return [];

  const unlocked = new Set(user.achievements.map((a) => a.achievement.code));
  const subjects = user.careers.flatMap((c) => c.subjects);
  const approved = subjects.filter((s) => s.status === "APROBADA");
  const maxGrade = approved.reduce((max, s) => Math.max(max, s.grade ?? 0), 0);
  const level = levelFromXp(user.xp).level;

  const halfCareer = user.careers.some((c) => {
    const total = effectiveTotal(c.totalSubjects, c.subjects.length);
    const done = c.subjects.filter((s) => s.status === "APROBADA").length;
    return total > 0 && done > 0 && done / total >= 0.5;
  });

  const completedCareer = user.careers.some((c) => {
    const total = effectiveTotal(c.totalSubjects, c.subjects.length);
    const done = c.subjects.filter((s) => s.status === "APROBADA").length;
    return total > 0 && done >= total;
  });

  const conditions: Record<AchievementCode, boolean> = {
    FIRST_APPROVED: approved.length >= 1,
    TEN_APPROVED: approved.length >= 10,
    TWENTY_FIVE_APPROVED: approved.length >= 25,
    HALF_CAREER: halfCareer,
    CAREER_COMPLETE: completedCareer,
    STREAK_7: Math.max(user.streak, user.longestStreak) >= 7,
    STREAK_30: user.longestStreak >= 30,
    PERFECT_GRADE: maxGrade >= 10,
    LEVEL_5: level >= 5,
    LEVEL_10: level >= 10,
  };

  const dbAchievements = await prisma.achievement.findMany();
  const byCode = new Map(dbAchievements.map((a) => [a.code, a]));

  const newly: UnlockedAchievement[] = [];
  let xpBonus = 0;

  for (const def of ACHIEVEMENT_DEFINITIONS) {
    if (unlocked.has(def.code) || !conditions[def.code]) continue;
    const dbAchievement = byCode.get(def.code);
    if (!dbAchievement) continue;
    try {
      await prisma.userAchievement.create({
        data: { userId, achievementId: dbAchievement.id },
      });
      newly.push({
        code: def.code,
        name: def.name,
        description: def.description,
        icon: def.icon,
        xpReward: def.xpReward,
      });
      xpBonus += def.xpReward;
    } catch {
      // Unique constraint: already unlocked (race condition) -> ignore
    }
  }

  if (newly.length > 0) {
    const xp = user.xp + xpBonus;
    const { level: newLevel } = levelFromXp(xp);
    await prisma.user.update({ where: { id: userId }, data: { xp, level: newLevel } });
  }

  return newly;
}
