import type { UserProfile } from "./types";

export type { UserProfile };

/**
 * Default initial seed users - Left empty in source code for strict security.
 * Zero credentials or password hashes in git codebase.
 * Users are loaded dynamically from Cloudflare KV (USERS_KV) or USERS_DATA_JSON (.env.local / Secrets).
 */
export const DEFAULT_USERS_DATA: Record<string, UserProfile> = {};

