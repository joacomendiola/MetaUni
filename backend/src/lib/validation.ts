import { z } from "zod";
import { badRequest } from "./errors";

export function parseBody<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const first = result.error.issues[0];
    const path = first?.path?.length ? `${first.path.join(".")}: ` : "";
    throw badRequest(`${path}${first?.message ?? "Datos invalidos"}`, "VALIDATION_ERROR");
  }
  return result.data;
}
