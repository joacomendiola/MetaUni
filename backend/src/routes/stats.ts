import type { FastifyInstance } from "fastify";
import {
  STATUS_LABELS,
  SUBJECT_STATUSES,
  levelFromXp,
  levelTitle,
  progressPercent,
  type OverviewStats,
  type SubjectStatus,
} from "@metauni/shared";
import { requireUser } from "../lib/auth-helpers";
import { effectiveTotal } from "../lib/mappers";

function gradeBucket(grade: number): string {
  if (grade < 4) return "0 - 3.99";
  if (grade < 6) return "4 - 5.99";
  if (grade < 8) return "6 - 7.99";
  if (grade < 10) return "8 - 9.99";
  return "10";
}

const GRADE_ORDER = ["0 - 3.99", "4 - 5.99", "6 - 7.99", "8 - 9.99", "10"];

export async function statsRoutes(fastify: FastifyInstance) {
  fastify.get("/overview", { preHandler: [fastify.authenticate] }, async (request) => {
    const user = await requireUser(fastify.prisma, request);

    const careers = await fastify.prisma.career.findMany({
      where: { ownerId: user.id, isCatalog: false },
      include: { subjects: true },
      orderBy: { createdAt: "asc" },
    });

    const achievements = await fastify.prisma.userAchievement.findMany({
      where: { userId: user.id },
      include: { achievement: true },
      orderBy: { unlockedAt: "desc" },
    });

    const subjects = careers.flatMap((c) => c.subjects);
    const approvedSubjects = subjects.filter((s) => s.status === "APROBADA");

    const totalTarget = careers.reduce(
      (acc, c) => acc + effectiveTotal(c.totalSubjects, c.subjects.length),
      0,
    );

    const statusDistribution = SUBJECT_STATUSES.map((status) => ({
      status,
      label: STATUS_LABELS[status],
      count: subjects.filter((s) => s.status === status).length,
    }));

    const gradeCounts = new Map<string, number>();
    for (const s of subjects) {
      if (s.grade === null || s.grade === undefined) continue;
      const bucket = gradeBucket(s.grade);
      gradeCounts.set(bucket, (gradeCounts.get(bucket) ?? 0) + 1);
    }
    const gradeDistribution = GRADE_ORDER.map((range) => ({
      range,
      count: gradeCounts.get(range) ?? 0,
    }));

    const grades = approvedSubjects
      .map((s) => s.grade)
      .filter((g): g is number => typeof g === "number");
    const averageGrade =
      grades.length > 0 ? Math.round((grades.reduce((a, b) => a + b, 0) / grades.length) * 100) / 100 : null;

    const levelInfo = levelFromXp(user.xp);

    const recentSubjects = subjects
      .slice()
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 6)
      .map((s) => {
        const career = careers.find((c) => c.id === s.careerId);
        return {
          id: s.id,
          name: s.name,
          careerName: career?.name ?? "",
          color: career?.color ?? "#6366f1",
          status: s.status as SubjectStatus,
          grade: s.grade,
          updatedAt: s.updatedAt.toISOString(),
        };
      });

    const result: OverviewStats = {
      totals: {
        careers: careers.length,
        subjects: subjects.length,
        approved: approvedSubjects.length,
        inProgress: subjects.filter((s) => s.status === "CURSANDO").length,
        regular: subjects.filter((s) => s.status === "REGULAR").length,
        pending: subjects.filter((s) => s.status === "PENDIENTE").length,
      },
      progressPercent: progressPercent(approvedSubjects.length, totalTarget),
      averageGrade,
      gamification: {
        xp: user.xp,
        level: levelInfo.level,
        levelTitle: levelTitle(levelInfo.level),
        xpIntoLevel: levelInfo.xpIntoLevel,
        xpToNextLevel: levelInfo.xpToNextLevel,
        levelProgress: levelInfo.progress,
        streak: user.streak,
        longestStreak: user.longestStreak,
      },
      statusDistribution,
      gradeDistribution,
      careers: careers.map((c) => {
        const total = effectiveTotal(c.totalSubjects, c.subjects.length);
        const approved = c.subjects.filter((s) => s.status === "APROBADA").length;
        return {
          id: c.id,
          name: c.name,
          color: c.color,
          total,
          approved,
          percent: progressPercent(approved, total),
        };
      }),
      recentSubjects,
      achievements: achievements.map((a) => ({
        code: a.achievement.code,
        name: a.achievement.name,
        description: a.achievement.description,
        icon: a.achievement.icon,
        unlockedAt: a.unlockedAt.toISOString(),
      })),
    };

    return result;
  });

  fastify.get("/achievements", { preHandler: [fastify.authenticate] }, async (request) => {
    const user = await requireUser(fastify.prisma, request);
    const unlocked = await fastify.prisma.userAchievement.findMany({
      where: { userId: user.id },
      include: { achievement: true },
    });
    return unlocked.map((a) => ({
      code: a.achievement.code,
      name: a.achievement.name,
      description: a.achievement.description,
      icon: a.achievement.icon,
      xpReward: a.achievement.xpReward,
      unlockedAt: a.unlockedAt.toISOString(),
    }));
  });
}
