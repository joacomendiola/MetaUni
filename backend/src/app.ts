import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import { PrismaClient } from "@prisma/client";
import { env, isProd } from "./env";
import { HttpError, forbidden, unauthorized } from "./lib/errors";
import { registerRoutes } from "./routes";

export async function buildApp() {
  const app = Fastify({
    logger: env.NODE_ENV !== "test",
  });

  const prisma = new PrismaClient();
  app.decorate("prisma", prisma);
  app.addHook("onClose", async () => {
    await prisma.$disconnect();
  });

  const origins = env.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean);
  await app.register(cors, {
    origin: origins.length > 0 ? origins : true,
    credentials: true,
  });
  await app.register(cookie);
  await app.register(jwt, { secret: env.JWT_ACCESS_SECRET });

  app.decorate("authenticate", async (request) => {
    try {
      await request.jwtVerify();
    } catch {
      throw unauthorized();
    }
  });

  app.decorate("authenticateAdmin", async (request) => {
    try {
      await request.jwtVerify();
    } catch {
      throw unauthorized();
    }
    if (request.user.role !== "ADMIN") throw forbidden("Se requiere rol de administrador");
  });

  app.setErrorHandler((error: any, request, reply) => {
    if (error instanceof HttpError) {
      return reply.code(error.statusCode).send({ message: error.message, code: error.code });
    }
    if (error.validation) {
      return reply.code(400).send({ message: "Datos invalidos", code: "VALIDATION_ERROR" });
    }
    const statusCode = (error as { statusCode?: number }).statusCode;
    if (statusCode && statusCode >= 400 && statusCode < 500) {
      return reply.code(statusCode).send({ message: error.message, code: "CLIENT_ERROR" });
    }
    request.log.error(error);
    return reply.code(500).send({ message: "Error interno del servidor" });
  });

  app.get("/api/health", async () => ({ status: "ok", env: env.NODE_ENV, ts: new Date().toISOString() }));

  await registerRoutes(app);

  if (!isProd) {
    app.ready().then(() => {
      app.log.info(`MetaUni API lista en http://localhost:${env.PORT}`);
    });
  }

  return app;
}
