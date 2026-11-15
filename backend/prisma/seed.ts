import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ACHIEVEMENT_DEFINITIONS, levelFromXp, xpForSubject, type SubjectStatus } from "@metauni/shared";
import { evaluateAchievements } from "../src/services/achievements";

const prisma = new PrismaClient();

const CATALOG = [
  {
    name: "Ingenieria en Sistemas",
    faculty: "Ingenieria",
    color: "#6366f1",
    description: "Plan de estudios orientado a software, redes y sistemas distribuidos.",
    subjects: [
      { name: "Programacion I", year: 1, term: 1, credits: 6 },
      { name: "Matematica I", year: 1, term: 1, credits: 6 },
      { name: "Algebra", year: 1, term: 2, credits: 6 },
      { name: "Programacion II", year: 2, term: 1, credits: 6 },
      { name: "Base de Datos", year: 2, term: 2, credits: 6 },
      { name: "Redes", year: 3, term: 1, credits: 6 },
      { name: "Ingenieria de Software", year: 3, term: 2, credits: 6 },
      { name: "Proyecto Final", year: 5, term: 2, credits: 12 },
    ],
  },
  {
    name: "Licenciatura en Administracion",
    faculty: "Ciencias Economicas",
    color: "#10b981",
    description: "Formacion en gestion de organizaciones, finanzas y marketing.",
    subjects: [
      { name: "Contabilidad I", year: 1, term: 1, credits: 6 },
      { name: "Economia I", year: 1, term: 1, credits: 6 },
      { name: "Derecho Comercial", year: 2, term: 1, credits: 6 },
      { name: "Marketing", year: 2, term: 2, credits: 6 },
      { name: "Finanzas", year: 3, term: 1, credits: 6 },
      { name: "Direccion Estrategica", year: 4, term: 2, credits: 8 },
    ],
  },
  {
    name: "Medicina",
    faculty: "Ciencias de la Salud",
    color: "#f43f5e",
    description: "Ciencias medicas con enfoque clinico y comunitario.",
    subjects: [
      { name: "Anatomia", year: 1, term: 1, credits: 8 },
      { name: "Histologia", year: 1, term: 2, credits: 6 },
      { name: "Fisiologia", year: 2, term: 1, credits: 8 },
      { name: "Farmacologia", year: 3, term: 1, credits: 6 },
      { name: "Clinica Medica", year: 5, term: 1, credits: 10 },
    ],
  },
];

const DEMO_SUBJECTS: { name: string; year: number; term: number; status: SubjectStatus; grade: number | null }[] = [
  { name: "Programacion I", year: 1, term: 1, status: "APROBADA", grade: 9 },
  { name: "Matematica I", year: 1, term: 1, status: "APROBADA", grade: 8 },
  { name: "Algebra", year: 1, term: 2, status: "APROBADA", grade: 7 },
  { name: "Programacion II", year: 2, term: 1, status: "APROBADA", grade: 10 },
  { name: "Base de Datos", year: 2, term: 2, status: "CURSANDO", grade: null },
  { name: "Redes", year: 3, term: 1, status: "REGULAR", grade: null },
  { name: "Ingenieria de Software", year: 3, term: 2, status: "PENDIENTE", grade: null },
  { name: "Proyecto Final", year: 5, term: 2, status: "PENDIENTE", grade: null },
];

async function seedAchievements() {
  for (const def of ACHIEVEMENT_DEFINITIONS) {
    await prisma.achievement.upsert({
      where: { code: def.code },
      update: { name: def.name, description: def.description, icon: def.icon, xpReward: def.xpReward },
      create: def,
    });
  }
  console.log(`Logros listos: ${ACHIEVEMENT_DEFINITIONS.length}`);
}

async function seedCatalog() {
  for (const catalog of CATALOG) {
    const existing = await prisma.career.findFirst({
      where: { name: catalog.name, isCatalog: true },
    });
    if (existing) continue;
    await prisma.career.create({
      data: {
        name: catalog.name,
        faculty: catalog.faculty,
        description: catalog.description,
        color: catalog.color,
        totalSubjects: catalog.subjects.length,
        isCatalog: true,
        subjects: {
          create: catalog.subjects.map((s) => ({
            name: s.name,
            year: s.year,
            term: s.term,
            credits: s.credits,
            status: "PENDIENTE" as const,
          })),
        },
      },
    });
  }
  console.log(`Carreras de catalogo listas: ${CATALOG.length}`);
}

async function seedUsers() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@metauni.app" },
    update: { role: "ADMIN" },
    create: {
      name: "Admin MetaUni",
      email: "admin@metauni.app",
      passwordHash: adminPassword,
      role: "ADMIN",
      streak: 1,
      longestStreak: 1,
      lastActiveAt: new Date(),
    },
  });

  const demoPassword = await bcrypt.hash("demo123", 10);
  const existingDemo = await prisma.user.findUnique({ where: { email: "demo@metauni.app" } });
  if (existingDemo) {
    console.log("Usuario demo ya existe");
    return;
  }

  const xp = DEMO_SUBJECTS.reduce((acc, s) => acc + xpForSubject(s.status, s.grade), 0);
  const { level } = levelFromXp(xp);

  const demo = await prisma.user.create({
    data: {
      name: "Estudiante Demo",
      email: "demo@metauni.app",
      passwordHash: demoPassword,
      role: "STUDENT",
      xp,
      level,
      streak: 4,
      longestStreak: 9,
      lastActiveAt: new Date(),
      careers: {
        create: {
          name: "Ingenieria en Sistemas",
          faculty: "Ingenieria",
          description: "Mi carrera de ejemplo",
          color: "#6366f1",
          totalSubjects: DEMO_SUBJECTS.length,
          isCatalog: false,
          subjects: {
            create: DEMO_SUBJECTS.map((s) => ({
              name: s.name,
              year: s.year,
              term: s.term,
              status: s.status,
              grade: s.grade,
              xpAwarded: xpForSubject(s.status, s.grade),
              completedAt: s.status === "APROBADA" ? new Date() : null,
            })),
          },
        },
      },
    },
  });

  await evaluateAchievements(prisma, demo.id);
  console.log("Usuario demo creado: demo@metauni.app / demo123");
}

async function main() {
  await seedAchievements();
  await seedCatalog();
  await seedUsers();
  console.log("Seed completado.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
