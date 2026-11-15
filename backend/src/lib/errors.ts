export class HttpError extends Error {
  statusCode: number;
  code?: string;

  constructor(statusCode: number, message: string, code?: string) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const badRequest = (message = "Solicitud invalida", code?: string) =>
  new HttpError(400, message, code);

export const unauthorized = (message = "No autenticado") => new HttpError(401, message, "UNAUTHORIZED");

export const forbidden = (message = "No autorizado") => new HttpError(403, message, "FORBIDDEN");

export const notFound = (message = "Recurso no encontrado") => new HttpError(404, message, "NOT_FOUND");

export const conflict = (message = "El recurso ya existe") => new HttpError(409, message, "CONFLICT");
