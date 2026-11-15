import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  adminUpdateUserSchema,
  careerCreateSchema,
  careerUpdateSchema,
  subjectCreateSchema,
  subjectUpdateSchema,
} from "@metauni/shared";
import { parseBody } from "../lib/validation";
import { requireUser } from "../lib/auth-helpers";
import { badRequest, notFound } from "../lib/errors";
import { careerToDTO, subjectToDTO, effectiveTotal } from "../lib/mappers";

export async function adminRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.authenticateAdmin);

  fastify.get("/overview", async () => {
    const [users, personalCareers, catalogCareers, subjects, approved] = await Promise.all([
      fastify.prisma.user.count(),
      fastify.prisma.career.count({ where: { isCatalog: false } }),
      fastify.prisma.career.count({ where: { isCatalog: true } }),
      fastify.prisma.subject.count(),
      fastify.prisma.subject.count({ where: { status: "APROBADA" } }),
    ]);
    return { users, personalCareers, catalogCareers, subjects, approved };
  });

  fastify.get("/users", async () => {
    const users = await fastify.prisma.user.findMany({
      include: { careers: { include: { subjects: { select: { status: true } } } } },
      orderBy: { createdAt: "desc" },
    });

    return users.map((u) => {
      const subjects = u.careers.flatMap((c) => c.subjects);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        xp: u.xp,
        level: u.level,
        streak: u.streak,
        careers: u.careers.length,
        subjects: subjects.length,
        approved: subjects.filter((s) => s.status === "APROBADA").length,
        createdAt: u.createdAt.toISOString(),
      };
    });
  });

  fastify.patch("/users/:id", async (request) => {
    const admin = await requireUser(fastify.prisma, request);
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const data = parseBody(adminUpdateUserSchema, request.body);

    if (id === admin.id && data.role && data.role !== "ADMIN") {
      throw badRequest("No podes quitarte el rol de administrador");
    }

    const user = await fastify.prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.role !== undefined ? { role: data.role } : {}),
      },
    });

    return { id: user.id, name: user.name, email: user.email, role: user.role };
  });

  fastify.delete("/users/:id", async (request) => {
    const admin = await requireUser(fastify.prisma, request);
    const { id } = z.object({ id: z.string() }).parse(request.params);
    if (id === admin.id) throw badRequest("No podes eliminar tu propia cuenta");
    await fastify.prisma.user.delete({ where: { id } });
    return { ok: true };
  });

  fastify.get("/careers", async () => {
    const careers = await fastify.prisma.career.findMany({
      where: { isCatalog: true },
      include: { subjects: true },
      orderBy: { name: "asc" },
    });
    return careers.map((c) => ({
      ...careerToDTO(c),
      subjectCount: c.subjects.length,
    }));
  });

  fastify.post("/careers", async (request, reply) => {
    const data = parseBody(careerCreateSchema, request.body);
    const career = await fastify.prisma.career.create({
      data: {
        name: data.name,
        faculty: data.faculty ?? null,
        description: data.description ?? null,
        color: data.color,
        totalSubjects: data.totalSubjects,
        isCatalog: true,
        ownerId: null,
      },
      include: { subjects: true },
    });
    return reply.code(201).send(careerToDTO(career));
  });

  fastify.patch("/careers/:id", async (request) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const data = parseBody(careerUpdateSchema, request.body);
    const existing = await fastify.prisma.career.findFirst({ where: { id, isCatalog: true } });
    if (!existing) throw notFound("Carrera de catalogo no encontrada");

    const career = await fastify.prisma.career.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.faculty !== undefined ? { faculty: data.faculty } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.color !== undefined ? { color: data.color } : {}),
        ...(data.totalSubjects !== undefined ? { totalSubjects: data.totalSubjects } : {}),
      },
      include: { subjects: true },
    });
    return careerToDTO(career);
  });

  fastify.delete("/careers/:id", async (request) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const existing = await fastify.prisma.career.findFirst({ where: { id, isCatalog: true } });
    if (!existing) throw notFound("Carrera de catalogo no encontrada");
    await fastify.prisma.career.delete({ where: { id } });
    return { ok: true };
  });

  fastify.post("/careers/:id/subjects", async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const career = await fastify.prisma.career.findFirst({ where: { id, isCatalog: true } });
    if (!career) throw notFound("Carrera de catalogo no encontrada");
    const data = parseBody(subjectCreateSchema, request.body);

    const subject = await fastify.prisma.subject.create({
      data: {
        careerId: id,
        name: data.name,
        year: data.year,
        term: data.term ?? null,
        credits: data.credits ?? null,
        status: "PENDIENTE",
        grade: null,
        notes: data.notes ?? null,
      },
    });

    return reply.code(201).send(subjectToDTO(subject));
  });

  fastify.patch("/subjects/:id", async (request) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const subject = await fastify.prisma.subject.findUnique({
      where: { id },
      include: { career: true },
    });
    if (!subject || !subject.career.isCatalog) throw notFound("Materia de catalogo no encontrada");
    const data = parseBody(subjectUpdateSchema, request.body);

    const updated = await fastify.prisma.subject.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.year !== undefined ? { year: data.year } : {}),
        ...(data.term !== undefined ? { term: data.term } : {}),
        ...(data.credits !== undefined ? { credits: data.credits } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
      },
    });
    return subjectToDTO(updated);
  });

  fastify.delete("/subjects/:id", async (request) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const subject = await fastify.prisma.subject.findUnique({
      where: { id },
      include: { career: true },
    });
    if (!subject || !subject.career.isCatalog) throw notFound("Materia de catalogo no encontrada");
    await fastify.prisma.subject.delete({ where: { id } });
    return { ok: true };
  });

  fastify.get("/careers/:id/total", async (request) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const career = await fastify.prisma.career.findFirst({
      where: { id, isCatalog: true },
      include: { subjects: true },
    });
    if (!career) throw notFound("Carrera de catalogo no encontrada");
    return { total: effectiveTotal(career.totalSubjects, career.subjects.length) };
  });
}
