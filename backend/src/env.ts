import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL es obligatoria"),
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET debe tener al menos 16 caracteres"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET debe tener al menos 16 caracteres"),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Configuracion de entorno invalida:");
  console.error(parsed.error.issues);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";
