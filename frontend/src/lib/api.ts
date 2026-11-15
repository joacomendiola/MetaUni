import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

const baseURL = import.meta.env.VITE_API_URL || "";

export const api = axios.create({ baseURL, withCredentials: true });
export const rawApi = axios.create({ baseURL, withCredentials: true });

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;

export function refreshSession(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = rawApi
      .post<{ accessToken: string }>("/api/auth/refresh", {})
      .then((res) => {
        setAccessToken(res.data.accessToken);
        return res.data.accessToken;
      })
      .catch(() => {
        setAccessToken(null);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;
    const url = original?.url ?? "";
    const isAuthCall = url.includes("/api/auth/");

    if (error.response?.status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      const token = await refreshSession();
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

export function apiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
    if (error.code === "ERR_NETWORK") return "No se pudo conectar con el servidor";
    return error.message;
  }
  return error instanceof Error ? error.message : "Ocurrio un error inesperado";
}
