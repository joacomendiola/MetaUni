import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AuthResponse, PublicUser } from "@metauni/shared";
import { api, rawApi, setAccessToken, setUnauthorizedHandler } from "@/lib/api";

interface AuthContextValue {
  user: PublicUser | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (user: PublicUser) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await rawApi.post<AuthResponse>("/api/auth/refresh");
        if (cancelled) return;
        setAccessToken(data.accessToken);
        setUser(data.user);
      } catch {
        setAccessToken(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setAccessToken(null);
      setUser(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<AuthResponse>("/api/auth/login", { email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { data } = await api.post<AuthResponse>("/api/auth/register", { name, email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // ignore
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const { data } = await api.get<PublicUser>("/api/users/me");
    setUser(data);
  }, []);

  const updateUser = useCallback((nextUser: PublicUser) => {
    setUser(nextUser);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAdmin: user?.role === "ADMIN",
      login,
      register,
      logout,
      refreshUser,
      updateUser,
    }),
    [user, loading, login, register, logout, refreshUser, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return context;
}
