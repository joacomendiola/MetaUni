import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { subjectCreateSchema, subjectUpdateSchema, xpForSubject } from "@metauni/shared";
import { parseBody } from "../lib/validation";
import { requireUser } from "../lib/auth-helpers";
import { forbidden, notFound } from "../lib/errors";
import { subjectToDTO } from "../lib/mappers";
import { toPublicUser } from "../lib/serialize";
import { addXp, touchActivity } from "../services/gamification";
import { evaluateAchievements } from "../services/achievements";

async function getOwnedCareerId(fastify: FastifyInstance, careerId: string, userId: string) {
  const career = await fastify.prisma.career.findUnique({ where: { id: careerId } });
  if (!career) throw notFound("Carrera no encontrada");
  if (career.ownerId !== userId) throw forbidden("No podes acceder a esta carrera");
  return career;
}

async function getOwnedSubject(fastify: FastifyInstance, subjectId: string, userId: string) {
  const subject = await fastify.prisma.subject.findUnique({
    where: { id: subjectId },
    include: { career: true },
  });
  if (!subject) throw notFound("Materia no encontrada");
  if (subject.career.ownerId !== userId) throw forbidden("No podes acceder a esta materia");
  return subject;
}

export async function subjectRoutes(fastify: FastifyInstance) {
  fastify.get("/careers/:careerId/subjects", { preHandler: [fastify.authenticate] }, async (request) => {
    const user = await requireUser(fastify.prisma, request);
    const { careerId } = z.object({ careerId: z.string() }).parse(request.params);
    await getOwnedCareerId(fastify, careerId, user.id);

    const subjects = await fastify.prisma.subject.findMany({
      where: { careerId },
      orderBy: [{ year: "asc" }, { name: "asc" }],
    });
    return subjects.map(subjectToDTO);
  });

  fastify.post("/careers/:careerId/subjects", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = await requireUser(fastify.prisma, request);
    const { careerId } = z.object({ careerId: z.string() }).parse(request.params);
    await getOwnedCareerId(fastify, careerId, user.id);
    const data = parseBody(subjectCreateSchema, request.body);

    const desiredXp = xpForSubject(data.status, data.grade ?? null);

    const subject = await fastify.prisma.subject.create({
      data: {
        careerId,
        name: data.name,
        year: data.year,
        term: data.term ?? null,
        credits: data.credits ?? null,
        status: data.status,
        grade: data.grade ?? null,
        notes: data.notes ?? null,
        xpAwarded: desiredXp,
        completedAt: data.status === "APROBADA" ? new Date() : null,
      },
    });

    await addXp(fastify.prisma, user.id, desiredXp);
    await touchActivity(fastify.prisma, user.id);
    const unlocked = await evaluateAchievements(fastify.prisma, user.id);
    const fresh = await fastify.prisma.user.findUniqueOrThrow({ where: { id: user.id } });

    return reply.code(201).send({
      subject: subjectToDTO(subject),
      user: toPublicUser(fresh),
      unlocked,
    });
  });

  fastify.patch("/subjects/:id", { preHandler: [fastify.authenticate] }, async (request) => {
    const user = await requireUser(fastify.prisma, request);
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const subject = await getOwnedSubject(fastify, id, user.id);
    const data = parseBody(subjectUpdateSchema, request.body);

    const newStatus = data.status ?? subject.status;
    const newGrade = data.grade !== undefined ? data.grade : subject.grade;
    const desiredXp = xpForSubject(newStatus, newGrade);
    const delta = desiredXp - subject.xpAwarded;

    let completedAt = subject.completedAt;
    if (newStatus === "APROBADA" && subject.status !== "APROBADA") {
      completedAt = new Date();
    } else if (newStatus !== "APROBADA") {
      completedAt = null;
    }

    const updated = await fastify.prisma.subject.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.year !== undefined ? { year: data.year } : {}),
        ...(data.term !== undefined ? { term: data.term } : {}),
        ...(data.credits !== undefined ? { credits: data.credits } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.grade !== undefined ? { grade: data.grade } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        xpAwarded: desiredXp,
        completedAt,
      },
    });

    if (delta !== 0) await addXp(fastify.prisma, user.id, delta);
    if (data.status !== undefined || data.grade !== undefined) {
      await touchActivity(fastify.prisma, user.id);
    }
    const unlocked = await evaluateAchievements(fastify.prisma, user.id);
    const fresh = await fastify.prisma.user.findUniqueOrThrow({ where: { id: user.id } });

    return {
      subject: subjectToDTO(updated),
      user: toPublicUser(fresh),
      unlocked,
    };
  });

  fastify.delete("/subjects/:id", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = await requireUser(fastify.prisma, request);
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const subject = await getOwnedSubject(fastify, id, user.id);

    await fastify.prisma.subject.delete({ where: { id } });
    if (subject.xpAwarded > 0) await addXp(fastify.prisma, user.id, -subject.xpAwarded);

    const fresh = await fastify.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    return reply.send({ ok: true, user: toPublicUser(fresh) });
  });
}
