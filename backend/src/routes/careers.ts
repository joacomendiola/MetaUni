import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { careerCreateSchema, careerUpdateSchema } from "@metauni/shared";
import { parseBody } from "../lib/validation";
import { requireUser } from "../lib/auth-helpers";
import { forbidden, notFound } from "../lib/errors";
import { careerToDTO, effectiveTotal } from "../lib/mappers";
import { touchActivity } from "../services/gamification";

async function getOwnedCareer(fastify: FastifyInstance, careerId: string, userId: string, includeSubjects = false) {
  const career = await fastify.prisma.career.findUnique({
    where: { id: careerId },
    include: includeSubjects ? { subjects: true } : undefined,
  });
  if (!career) throw notFound("Carrera no encontrada");
  if (career.ownerId !== userId) throw forbidden("No podes acceder a esta carrera");
  return career;
}

export async function careerRoutes(fastify: FastifyInstance) {
  fastify.get("/", { preHandler: [fastify.authenticate] }, async (request) => {
    const user = await requireUser(fastify.prisma, request);
    const careers = await fastify.prisma.career.findMany({
      where: { ownerId: user.id, isCatalog: false },
      include: { subjects: true },
      orderBy: { createdAt: "asc" },
    });
    return careers.map(careerToDTO);
  });

  fastify.get("/catalog", { preHandler: [fastify.authenticate] }, async () => {
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

  fastify.get("/:id", { preHandler: [fastify.authenticate] }, async (request) => {
    const user = await requireUser(fastify.prisma, request);
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const career = await getOwnedCareer(fastify, id, user.id, true);
    return careerToDTO(career);
  });

  fastify.post("/", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = await requireUser(fastify.prisma, request);
    const data = parseBody(careerCreateSchema, request.body);

    const career = await fastify.prisma.career.create({
      data: {
        name: data.name,
        faculty: data.faculty ?? null,
        description: data.description ?? null,
        color: data.color,
        totalSubjects: data.totalSubjects,
        isCatalog: false,
        ownerId: user.id,
      },
      include: { subjects: true },
    });

    await touchActivity(fastify.prisma, user.id);
    return reply.code(201).send(careerToDTO(career));
  });

  fastify.post("/from-catalog/:id", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = await requireUser(fastify.prisma, request);
    const { id } = z.object({ id: z.string() }).parse(request.params);

    const catalog = await fastify.prisma.career.findFirst({
      where: { id, isCatalog: true },
      include: { subjects: true },
    });
    if (!catalog) throw notFound("Carrera de catalogo no encontrada");

    const career = await fastify.prisma.career.create({
      data: {
        name: catalog.name,
        faculty: catalog.faculty,
        description: catalog.description,
        color: catalog.color,
        totalSubjects: effectiveTotal(catalog.totalSubjects, catalog.subjects.length),
        isCatalog: false,
        ownerId: user.id,
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
      include: { subjects: true },
    });

    await touchActivity(fastify.prisma, user.id);
    return reply.code(201).send(careerToDTO(career));
  });

  fastify.patch("/:id", { preHandler: [fastify.authenticate] }, async (request) => {
    const user = await requireUser(fastify.prisma, request);
    const { id } = z.object({ id: z.string() }).parse(request.params);
    await getOwnedCareer(fastify, id, user.id);
    const data = parseBody(careerUpdateSchema, request.body);

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

  fastify.delete("/:id", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = await requireUser(fastify.prisma, request);
    const { id } = z.object({ id: z.string() }).parse(request.params);
    await getOwnedCareer(fastify, id, user.id);
    await fastify.prisma.career.delete({ where: { id } });
    return reply.send({ ok: true });
  });
}
