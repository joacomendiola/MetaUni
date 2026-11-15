import type { PublicUser, Subject } from "@metauni/shared";

export interface UnlockedAchievement {
  code: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
}

export interface SubjectMutationResponse {
  subject: Subject;
  user: PublicUser;
  unlocked: UnlockedAchievement[];
}
