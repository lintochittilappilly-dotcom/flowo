// OAuth configuration for all supported social platforms
// When platform env vars are added, each platform activates automatically

export interface OAuthPlatformConfig {
  key: string;
  label: string;
  enabled: boolean;
  icon: string;
  color: string;
  gradientClass: string;
  scopes: string[];
}

// Client-side config — only exposes enabled flags and display info
// Actual OAuth secrets live in edge function env only
export const OAUTH_PLATFORMS: Record<string, OAuthPlatformConfig> = {
  instagram: {
    key: "instagram",
    label: "Instagram",
    enabled: import.meta.env.VITE_INSTAGRAM_ENABLED === "true",
    icon: "instagram",
    color: "#E1306C",
    gradientClass: "from-pink-500 to-purple-500",
    scopes: ["user_profile", "user_media", "instagram_content_publish"],
  },
  linkedin: {
    key: "linkedin",
    label: "LinkedIn",
    enabled: import.meta.env.VITE_LINKEDIN_ENABLED === "true",
    icon: "linkedin",
    color: "#0A66C2",
    gradientClass: "from-blue-600 to-blue-500",
    scopes: ["openid", "profile", "email", "w_member_social"],
  },
  twitter: {
    key: "twitter",
    label: "Twitter / X",
    enabled: import.meta.env.VITE_TWITTER_ENABLED === "true",
    icon: "twitter",
    color: "#000000",
    gradientClass: "from-gray-900 to-gray-700",
    scopes: ["tweet.read", "tweet.write", "users.read", "offline.access"],
  },
  facebook: {
    key: "facebook",
    label: "Facebook",
    enabled: import.meta.env.VITE_FACEBOOK_ENABLED === "true",
    icon: "facebook",
    color: "#1877F2",
    gradientClass: "from-blue-700 to-blue-600",
    scopes: ["pages_show_list", "pages_read_engagement", "pages_manage_posts"],
  },
  tiktok: {
    key: "tiktok",
    label: "TikTok",
    enabled: import.meta.env.VITE_TIKTOK_ENABLED === "true",
    icon: "tiktok",
    color: "#010101",
    gradientClass: "from-gray-900 to-gray-700",
    scopes: ["user.info.basic", "video.publish", "video.upload"],
  },
  pinterest: {
    key: "pinterest",
    label: "Pinterest",
    enabled: import.meta.env.VITE_PINTEREST_ENABLED === "true",
    icon: "pinterest",
    color: "#E60023",
    gradientClass: "from-red-600 to-red-500",
    scopes: ["boards:read", "pins:read", "pins:write"],
  },
};

export type PlatformKey = keyof typeof OAUTH_PLATFORMS;

export const PLATFORM_KEYS = Object.keys(OAUTH_PLATFORMS) as PlatformKey[];

export function isPlatformEnabled(platform: string): boolean {
  return OAUTH_PLATFORMS[platform.toLowerCase()]?.enabled ?? false;
}
