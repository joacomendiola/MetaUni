import { useQuery } from "@tanstack/react-query";
import type { Career, OverviewStats, PublicUser } from "@metauni/shared";
import { api } from "@/lib/api";

export const queryKeys = {
  overview: ["overview"] as const,
  careers: ["careers"] as const,
  career: (id: string) => ["career", id] as const,
  catalog: ["catalog"] as const,
  achievements: ["achievements"] as const,
  adminOverview: ["admin", "overview"] as const,
  adminUsers: ["admin", "users"] as const,
  adminCareers: ["admin", "careers"] as const,
};

export interface AchievementWithReward {
  code: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  unlockedAt: string;
}

export interface AdminOverview {
  users: number;
  personalCareers: number;
  catalogCareers: number;
  subjects: number;
  approved: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "ADMIN";
  xp: number;
  level: number;
  streak: number;
  careers: number;
  subjects: number;
  approved: number;
  createdAt: string;
}

export interface CatalogCareer extends Career {
  subjectCount: number;
}

export function useOverview() {
  return useQuery({
    queryKey: queryKeys.overview,
    queryFn: async () => (await api.get<OverviewStats>("/api/stats/overview")).data,
  });
}

export function useCareers() {
  return useQuery({
    queryKey: queryKeys.careers,
    queryFn: async () => (await api.get<Career[]>("/api/careers")).data,
  });
}

export function useCareer(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.career(id ?? ""),
    queryFn: async () => (await api.get<Career>(`/api/careers/${id}`)).data,
    enabled: Boolean(id),
  });
}

export function useCatalog() {
  return useQuery({
    queryKey: queryKeys.catalog,
    queryFn: async () => (await api.get<CatalogCareer[]>("/api/careers/catalog")).data,
  });
}

export function useAchievements() {
  return useQuery({
    queryKey: queryKeys.achievements,
    queryFn: async () => (await api.get<AchievementWithReward[]>("/api/stats/achievements")).data,
  });
}

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get<PublicUser>("/api/users/me")).data,
  });
}

export function useAdminOverview() {
  return useQuery({
    queryKey: queryKeys.adminOverview,
    queryFn: async () => (await api.get<AdminOverview>("/api/admin/overview")).data,
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: queryKeys.adminUsers,
    queryFn: async () => (await api.get<AdminUser[]>("/api/admin/users")).data,
  });
}

export function useAdminCareers() {
  return useQuery({
    queryKey: queryKeys.adminCareers,
    queryFn: async () => (await api.get<CatalogCareer[]>("/api/admin/careers")).data,
  });
}
