import type { FastifyInstance } from "fastify";
import { authRoutes } from "./auth";
import { userRoutes } from "./users";
import { careerRoutes } from "./careers";
import { subjectRoutes } from "./subjects";
import { statsRoutes } from "./stats";
import { adminRoutes } from "./admin";

export async function registerRoutes(app: FastifyInstance) {
  app.register(authRoutes, { prefix: "/api/auth" });
  app.register(userRoutes, { prefix: "/api/users" });
  app.register(careerRoutes, { prefix: "/api/careers" });
  app.register(subjectRoutes, { prefix: "/api" });
  app.register(statsRoutes, { prefix: "/api/stats" });
  app.register(adminRoutes, { prefix: "/api/admin" });
}
