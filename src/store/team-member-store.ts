import { create } from 'zustand';

interface TeamMemberStore {
  isMember: boolean;
  ownerUserId: string | null;
  memberRole: string | null;
  memberPermissions: Record<string, boolean>;
  ownerName: string | null;
  setMemberContext: (context: {
    ownerUserId: string;
    role: string;
    permissions: Record<string, boolean>;
    ownerName?: string;
  }) => void;
  clearMemberContext: () => void;
}

export const useTeamMemberStore = create<TeamMemberStore>((set) => ({
  isMember: false,
  ownerUserId: null,
  memberRole: null,
  memberPermissions: {},
  ownerName: null,
  setMemberContext: (context) =>
    set({
      isMember: true,
      ownerUserId: context.ownerUserId,
      memberRole: context.role,
      memberPermissions: context.permissions,
      ownerName: context.ownerName ?? null,
    }),
  clearMemberContext: () =>
    set({
      isMember: false,
      ownerUserId: null,
      memberRole: null,
      memberPermissions: {},
      ownerName: null,
    }),
}));

export function useTeamPermission(permission: string): boolean {
  const { isMember, memberPermissions } = useTeamMemberStore();
  if (!isMember) return true; // Owner has all permissions
  return memberPermissions[permission] ?? false;
}

export function useEffectiveUserId(currentUserId: string | undefined): string {
  const { isMember, ownerUserId } = useTeamMemberStore();
  return isMember && ownerUserId ? ownerUserId : (currentUserId ?? '');
}
