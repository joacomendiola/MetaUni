import type { FastifyRequest } from "fastify";
import type { PrismaClient, User } from "@prisma/client";
import { unauthorized } from "../lib/errors";

export async function requireUser(prisma: PrismaClient, request: FastifyRequest): Promise<User> {
  const sub = request.user?.sub;
  if (!sub) throw unauthorized();
  const user = await prisma.user.findUnique({ where: { id: sub } });
  if (!user) throw unauthorized("Usuario no encontrado");
  return user;
}

export function ensureAdmin(user: User): void {
  if (user.role !== "ADMIN") throw unauthorized("Se requiere rol de administrador");
}
