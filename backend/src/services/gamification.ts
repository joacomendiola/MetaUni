import type { PrismaClient } from "@prisma/client";
import { levelFromXp } from "@metauni/shared";

function startOfDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export async function touchActivity(prisma: PrismaClient, userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastActiveAt: true, streak: true, longestStreak: true },
  });
  if (!user) return;

  const now = new Date();
  let streak = user.streak;

  if (!user.lastActiveAt) {
    streak = Math.max(1, streak);
  } else {
    const diffDays = Math.round((startOfDay(now) - startOfDay(user.lastActiveAt)) / 86_400_000);
    if (diffDays === 0) {
      streak = Math.max(1, streak);
    } else if (diffDays === 1) {
      streak = streak + 1;
    } else {
      streak = 1;
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      streak,
      longestStreak: Math.max(user.longestStreak, streak),
      lastActiveAt: now,
    },
  });
}

export async function addXp(prisma: PrismaClient, userId: string, delta: number): Promise<void> {
  if (delta === 0) return;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { xp: true } });
  if (!user) return;
  const xp = Math.max(0, user.xp + delta);
  const { level } = levelFromXp(xp);
  await prisma.user.update({ where: { id: userId }, data: { xp, level } });
}
