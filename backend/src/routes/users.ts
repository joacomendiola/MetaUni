import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { updateProfileSchema } from "@metauni/shared";
import { parseBody } from "../lib/validation";
import { requireUser } from "../lib/auth-helpers";
import { conflict } from "../lib/errors";
import { toPublicUser } from "../lib/serialize";

export async function userRoutes(fastify: FastifyInstance) {
  fastify.get("/me", { preHandler: [fastify.authenticate] }, async (request) => {
    const user = await requireUser(fastify.prisma, request);
    return toPublicUser(user);
  });

  fastify.patch("/me", { preHandler: [fastify.authenticate] }, async (request) => {
    const user = await requireUser(fastify.prisma, request);
    const data = parseBody(updateProfileSchema, request.body);

    if (data.email && data.email !== user.email) {
      const existing = await fastify.prisma.user.findUnique({ where: { email: data.email } });
      if (existing) throw conflict("El email ya esta en uso");
    }

    const updated = await fastify.prisma.user.update({
      where: { id: user.id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
        ...(data.password ? { passwordHash: await bcrypt.hash(data.password, 10) } : {}),
      },
    });

    return toPublicUser(updated);
  });
}
