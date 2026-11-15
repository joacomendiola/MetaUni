import { describe, expect, it } from "vitest";
import {
  careerCreateSchema,
  levelFromXp,
  levelTitle,
  normalizeGrade,
  progressPercent,
  registerSchema,
  subjectCreateSchema,
  xpForSubject,
  xpForNextLevel,
} from "@metauni/shared";

describe("xpForSubject", () => {
  it("asigna XP base segun el estado", () => {
    expect(xpForSubject("PENDIENTE")).toBe(0);
    expect(xpForSubject("CURSANDO")).toBe(20);
    expect(xpForSubject("REGULAR")).toBe(60);
    expect(xpForSubject("APROBADA")).toBe(100);
  });

  it("suma bonus por nota en materias aprobadas", () => {
    expect(xpForSubject("APROBADA", 10)).toBe(200);
    expect(xpForSubject("APROBADA", 8)).toBe(180);
    expect(xpForSubject("APROBADA", 4)).toBe(140);
  });

  it("no suma bonus si la materia no esta aprobada", () => {
    expect(xpForSubject("REGULAR", 9)).toBe(60);
  });
});

describe("levelFromXp", () => {
  it("empieza en nivel 1 con 0 XP", () => {
    const info = levelFromXp(0);
    expect(info.level).toBe(1);
    expect(info.xpIntoLevel).toBe(0);
    expect(info.progress).toBe(0);
  });

  it("sube de nivel al alcanzar el umbral", () => {
    expect(levelFromXp(99).level).toBe(1);
    expect(levelFromXp(100).level).toBe(2);
    expect(levelFromXp(249).level).toBe(2);
    expect(levelFromXp(250).level).toBe(3);
  });

  it("los costos de nivel son crecientes", () => {
    expect(xpForNextLevel(1)).toBe(100);
    expect(xpForNextLevel(2)).toBe(150);
    expect(xpForNextLevel(5)).toBe(300);
  });

  it("devuelve progreso coherente", () => {
    const info = levelFromXp(120);
    expect(info.level).toBe(2);
    expect(info.xpIntoLevel).toBe(20);
    expect(info.xpToNextLevel).toBe(130);
    expect(info.progress).toBe(13);
  });
});

describe("helpers de progreso", () => {
  it("calcula porcentajes y evita division por cero", () => {
    expect(progressPercent(0, 0)).toBe(0);
    expect(progressPercent(5, 10)).toBe(50);
    expect(progressPercent(20, 10)).toBe(100);
  });

  it("normaliza notas a dos decimales", () => {
    expect(normalizeGrade(8.456)).toBe(8.46);
  });

  it("asigna titulos por nivel", () => {
    expect(levelTitle(1)).toBe("Novato");
    expect(levelTitle(4)).toBe("Aprendiz");
    expect(levelTitle(11)).toBe("Veterano");
  });
});

describe("validaciones compartidas", () => {
  it("normaliza el email y rechaza passwords cortas", () => {
    const ok = registerSchema.safeParse({
      name: "Joaco",
      email: "  JOACO@MetaUni.app ",
      password: "123456",
    });
    expect(ok.success).toBe(true);
    if (ok.success) expect(ok.data.email).toBe("joaco@metauni.app");

    const bad = registerSchema.safeParse({ name: "J", email: "no-es-email", password: "123" });
    expect(bad.success).toBe(false);
  });

  it("valida el color hex de una carrera", () => {
    const ok = careerCreateSchema.safeParse({ name: "Sistemas", color: "#6366f1" });
    expect(ok.success).toBe(true);

    const bad = careerCreateSchema.safeParse({ name: "Sistemas", color: "violeta" });
    expect(bad.success).toBe(false);
  });

  it("aplica defaults en la creacion de materias", () => {
    const parsed = subjectCreateSchema.parse({ name: "Programacion I" });
    expect(parsed.status).toBe("PENDIENTE");
    expect(parsed.year).toBe(1);
  });
});
