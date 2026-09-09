export const ROLE_PERMISSIONS = {
  admin: {
    label: 'Admin',
    description: 'Full access except billing and team ownership transfer',
    color: 'hsl(var(--primary))',
    permissions: {
      dashboard: true,
      calendar: true,
      create_post: true,
      analytics: true,
      comments: true,
      trends: true,
      brands: true,
      settings: false,
      publish_posts: true,
      delete_posts: true,
      manage_team: true,
    },
  },
  editor: {
    label: 'Editor',
    description: 'Can create and schedule posts but cannot publish or manage brands',
    color: 'hsl(var(--secondary))',
    permissions: {
      dashboard: true,
      calendar: true,
      create_post: true,
      analytics: false,
      comments: true,
      trends: true,
      brands: false,
      settings: false,
      publish_posts: false,
      delete_posts: false,
      manage_team: false,
    },
  },
  viewer: {
    label: 'Viewer',
    description: 'Read-only access to dashboard and analytics',
    color: 'hsl(var(--success))',
    permissions: {
      dashboard: true,
      calendar: true,
      create_post: false,
      analytics: true,
      comments: false,
      trends: true,
      brands: false,
      settings: false,
      publish_posts: false,
      delete_posts: false,
      manage_team: false,
    },
  },
} as const;

export type Role = keyof typeof ROLE_PERMISSIONS;
export type Permission = keyof typeof ROLE_PERMISSIONS.admin.permissions;

export function getRolePermissions(role: string) {
  return ROLE_PERMISSIONS[role as Role]?.permissions
    ?? ROLE_PERMISSIONS.editor.permissions;
}

export function canMemberDo(role: string, permission: Permission): boolean {
  return getRolePermissions(role)[permission] ?? false;
}

export function getRoleConfig(role: string) {
  return ROLE_PERMISSIONS[role as Role] ?? ROLE_PERMISSIONS.editor;
}

export const PERMISSION_LABELS: Record<Permission, { name: string; description: string }> = {
  dashboard: { name: 'View Dashboard', description: 'Access the main dashboard' },
  calendar: { name: 'Content Calendar', description: 'View and manage the content calendar' },
  create_post: { name: 'Create Posts', description: 'Create and edit post drafts' },
  analytics: { name: 'View Analytics', description: 'Access analytics and reporting' },
  comments: { name: 'Manage Comments', description: 'View and reply to comments' },
  trends: { name: 'View Trends', description: 'Access trending topics' },
  brands: { name: 'Manage Brands', description: 'Create, edit, and delete brands' },
  settings: { name: 'Access Settings', description: 'View and modify workspace settings' },
  publish_posts: { name: 'Publish Posts', description: 'Publish posts to social platforms' },
  delete_posts: { name: 'Delete Posts', description: 'Permanently delete posts' },
  manage_team: { name: 'Manage Team', description: 'Invite and remove team members' },
};
