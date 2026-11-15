import type { FastifyInstance, FastifyReply } from "fastify";
import bcrypt from "bcryptjs";
import { loginSchema, registerSchema } from "@metauni/shared";
import { env, isProd } from "../env";
import { conflict, unauthorized } from "../lib/errors";
import { parseBody } from "../lib/validation";
import { toPublicUser } from "../lib/serialize";
import { requireUser } from "../lib/auth-helpers";
import { REFRESH_COOKIE, addDays, generateRefreshToken, hashToken } from "../lib/tokens";
import { touchActivity } from "../services/gamification";

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: isProd ? ("none" as const) : ("lax" as const),
    secure: isProd,
    path: "/api/auth",
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60,
  };
}

async function issueRefreshToken(fastify: FastifyInstance, reply: FastifyReply, userId: string) {
  const token = generateRefreshToken();
  await fastify.prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt: addDays(new Date(), env.REFRESH_TOKEN_TTL_DAYS),
    },
  });
  reply.setCookie(REFRESH_COOKIE, token, cookieOptions());
}

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/register", async (request, reply) => {
    const data = parseBody(registerSchema, request.body);

    const existing = await fastify.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw conflict("El email ya esta registrado");

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await fastify.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        streak: 1,
        longestStreak: 1,
        lastActiveAt: new Date(),
      },
    });

    const accessToken = fastify.jwt.sign(
      { sub: user.id, role: user.role },
      { expiresIn: env.ACCESS_TOKEN_TTL },
    );
    await issueRefreshToken(fastify, reply, user.id);

    return reply.code(201).send({ accessToken, user: toPublicUser(user) });
  });

  fastify.post("/login", async (request, reply) => {
    const data = parseBody(loginSchema, request.body);

    const user = await fastify.prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw unauthorized("Credenciales invalidas");

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) throw unauthorized("Credenciales invalidas");

    await touchActivity(fastify.prisma, user.id);

    const accessToken = fastify.jwt.sign(
      { sub: user.id, role: user.role },
      { expiresIn: env.ACCESS_TOKEN_TTL },
    );
    await issueRefreshToken(fastify, reply, user.id);

    const fresh = await fastify.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    return reply.send({ accessToken, user: toPublicUser(fresh) });
  });

  fastify.post("/refresh", async (request, reply) => {
    const raw = request.cookies[REFRESH_COOKIE];
    if (!raw) throw unauthorized("Sin refresh token");

    const stored = await fastify.prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(raw) },
      include: { user: true },
    });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      reply.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
      throw unauthorized("Refresh token invalido o expirado");
    }

    await fastify.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    await issueRefreshToken(fastify, reply, stored.userId);

    const accessToken = fastify.jwt.sign(
      { sub: stored.userId, role: stored.user.role },
      { expiresIn: env.ACCESS_TOKEN_TTL },
    );

    return reply.send({ accessToken, user: toPublicUser(stored.user) });
  });

  fastify.post("/logout", async (request, reply) => {
    const raw = request.cookies[REFRESH_COOKIE];
    if (raw) {
      await fastify.prisma.refreshToken.updateMany({
        where: { tokenHash: hashToken(raw), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    reply.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
    return reply.send({ ok: true });
  });

  fastify.get("/me", { preHandler: [fastify.authenticate] }, async (request) => {
    const user = await requireUser(fastify.prisma, request);
    return toPublicUser(user);
  });
}
