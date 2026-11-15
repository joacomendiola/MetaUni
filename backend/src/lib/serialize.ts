import type { User } from "@prisma/client";
import type { PublicUser } from "@metauni/shared";

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    xp: user.xp,
    level: user.level,
    streak: user.streak,
    longestStreak: user.longestStreak,
    createdAt: user.createdAt.toISOString(),
  };
}
