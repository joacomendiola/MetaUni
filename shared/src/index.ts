import { z } from "zod";

export const SUBJECT_STATUSES = ["PENDIENTE", "CURSANDO", "REGULAR", "APROBADA"] as const;
export type SubjectStatus = (typeof SUBJECT_STATUSES)[number];

export const ROLES = ["STUDENT", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const STATUS_LABELS: Record<SubjectStatus, string> = {
  PENDIENTE: "Pendiente",
  CURSANDO: "Cursando",
  REGULAR: "Regular",
  APROBADA: "Aprobada",
};

export const STATUS_XP: Record<SubjectStatus, number> = {
  PENDIENTE: 0,
  CURSANDO: 20,
  REGULAR: 60,
  APROBADA: 100,
};

export const GRADE_BONUS_MULTIPLIER = 10;
export const PASSING_GRADE = 4;

export function normalizeGrade(grade: number): number {
  return Math.round(grade * 100) / 100;
}

export function xpForSubject(status: SubjectStatus, grade?: number | null): number {
  const base = STATUS_XP[status] ?? 0;
  if (status === "APROBADA" && typeof grade === "number") {
    return base + Math.round(grade * GRADE_BONUS_MULTIPLIER);
  }
  return base;
}

export function xpForNextLevel(level: number): number {
  return 100 + (level - 1) * 50;
}

export function levelFromXp(xp: number): { level: number; xpIntoLevel: number; xpToNextLevel: number; progress: number } {
  let level = 1;
  let remaining = Math.max(0, Math.floor(xp));
  while (remaining >= xpForNextLevel(level)) {
    remaining -= xpForNextLevel(level);
    level += 1;
  }
  const needed = xpForNextLevel(level);
  return {
    level,
    xpIntoLevel: remaining,
    xpToNextLevel: needed - remaining,
    progress: Math.round((remaining / needed) * 100),
  };
}

export function levelTitle(level: number): string {
  if (level >= 20) return "Leyenda";
  if (level >= 15) return "Maestro";
  if (level >= 10) return "Veterano";
  if (level >= 6) return "Avanzado";
  if (level >= 3) return "Aprendiz";
  return "Novato";
}

export function progressPercent(done: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((done / total) * 100));
}

export const ACHIEVEMENT_CODES = {
  FIRST_APPROVED: "FIRST_APPROVED",
  TEN_APPROVED: "TEN_APPROVED",
  TWENTY_FIVE_APPROVED: "TWENTY_FIVE_APPROVED",
  HALF_CAREER: "HALF_CAREER",
  CAREER_COMPLETE: "CAREER_COMPLETE",
  STREAK_7: "STREAK_7",
  STREAK_30: "STREAK_30",
  PERFECT_GRADE: "PERFECT_GRADE",
  LEVEL_5: "LEVEL_5",
  LEVEL_10: "LEVEL_10",
} as const;

export type AchievementCode = (typeof ACHIEVEMENT_CODES)[keyof typeof ACHIEVEMENT_CODES];

export const ACHIEVEMENT_DEFINITIONS: {
  code: AchievementCode;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
}[] = [
  { code: "FIRST_APPROVED", name: "Primer paso", description: "Aprobaste tu primera materia.", icon: "🎯", xpReward: 25 },
  { code: "TEN_APPROVED", name: "En racha", description: "Aprobaste 10 materias.", icon: "🔥", xpReward: 75 },
  { code: "TWENTY_FIVE_APPROVED", name: "Imparable", description: "Aprobaste 25 materias.", icon: "⚡", xpReward: 150 },
  { code: "HALF_CAREER", name: "Mitad de camino", description: "Completaste el 50% de una carrera.", icon: "🧗", xpReward: 200 },
  { code: "CAREER_COMPLETE", name: "Graduado", description: "Completaste una carrera entera.", icon: "🎓", xpReward: 500 },
  { code: "STREAK_7", name: "Constancia", description: "7 dias seguidos de actividad.", icon: "📅", xpReward: 50 },
  { code: "STREAK_30", name: "Disciplina", description: "30 dias seguidos de actividad.", icon: "🏅", xpReward: 300 },
  { code: "PERFECT_GRADE", name: "Excelencia", description: "Sacaste un 10 en una materia.", icon: "🌟", xpReward: 100 },
  { code: "LEVEL_5", name: "Ascenso", description: "Alcanzaste el nivel 5.", icon: "🚀", xpReward: 100 },
  { code: "LEVEL_10", name: "Veterano", description: "Alcanzaste el nivel 10.", icon: "🛡️", xpReward: 250 },
];

// ---------- Zod schemas ----------

export const registerSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(60),
  email: z.string().trim().toLowerCase().email("Email invalido"),
  password: z.string().min(6, "La contrasena debe tener al menos 6 caracteres").max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalido"),
  password: z.string().min(1, "La contrasena es obligatoria"),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  avatarUrl: z.string().trim().url("URL invalida").nullable().optional(),
  password: z.string().min(6).max(100).optional(),
});

export const careerCreateSchema = z.object({
  name: z.string().trim().min(2, "El nombre es obligatorio").max(120),
  faculty: z.string().trim().max(120).optional().nullable(),
  description: z.string().trim().max(600).optional().nullable(),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, "Color hex invalido")
    .default("#6366f1"),
  totalSubjects: z.coerce.number().int().min(0).max(500).default(0),
});

export const careerUpdateSchema = careerCreateSchema.partial();

export const subjectCreateSchema = z.object({
  name: z.string().trim().min(2, "El nombre es obligatorio").max(120),
  year: z.coerce.number().int().min(1).max(10).default(1),
  term: z.coerce.number().int().min(1).max(2).nullable().optional(),
  credits: z.coerce.number().int().min(0).max(50).nullable().optional(),
  status: z.enum(SUBJECT_STATUSES).default("PENDIENTE"),
  grade: z.coerce.number().min(0).max(10).nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export const subjectUpdateSchema = subjectCreateSchema.partial();

export const adminUpdateUserSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  role: z.enum(ROLES).optional(),
});

// ---------- Shared API types ----------

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
  xp: number;
  level: number;
  streak: number;
  longestStreak: number;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: PublicUser;
}

export interface Subject {
  id: string;
  careerId: string;
  name: string;
  year: number;
  term: number | null;
  credits: number | null;
  status: SubjectStatus;
  grade: number | null;
  notes: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Career {
  id: string;
  name: string;
  faculty: string | null;
  description: string | null;
  color: string;
  totalSubjects: number;
  isCatalog: boolean;
  ownerId: string | null;
  createdAt: string;
  updatedAt: string;
  subjects?: Subject[];
  progress?: {
    total: number;
    approved: number;
    percent: number;
  };
}

export interface OverviewStats {
  totals: {
    careers: number;
    subjects: number;
    approved: number;
    inProgress: number;
    regular: number;
    pending: number;
  };
  progressPercent: number;
  averageGrade: number | null;
  gamification: {
    xp: number;
    level: number;
    levelTitle: string;
    xpIntoLevel: number;
    xpToNextLevel: number;
    levelProgress: number;
    streak: number;
    longestStreak: number;
  };
  statusDistribution: { status: SubjectStatus; label: string; count: number }[];
  gradeDistribution: { range: string; count: number }[];
  careers: {
    id: string;
    name: string;
    color: string;
    total: number;
    approved: number;
    percent: number;
  }[];
  recentSubjects: {
    id: string;
    name: string;
    careerName: string;
    color: string;
    status: SubjectStatus;
    grade: number | null;
    updatedAt: string;
  }[];
  achievements: {
    code: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt: string;
  }[];
}

export interface ApiError {
  message: string;
  code?: string;
}
