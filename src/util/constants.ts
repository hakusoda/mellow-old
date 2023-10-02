import type { OAuthClientId, OAuthClientSecret } from '@voxelified/roblox-open-cloud';
export const DISCORD_TOKEN = Deno.env.get('DISCORD_TOKEN')!;
export const DISCORD_APP_ID = Deno.env.get('DISCORD_APP_ID')!;
export const DISCORD_PUBLIC_KEY = Deno.env.get('DISCORD_PUBLIC_KEY')!;

export const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
export const SUPABASE_TOKEN = Deno.env.get('SUPABASE_TOKEN')!;

export const MELLOW_KEY = Deno.env.get('MELLOW_KEY')!;

export const ROBLOX_OAUTH_CLIENT_ID = Deno.env.get('ROBLOX_OAUTH_CLIENT_ID')! as OAuthClientId;
export const ROBLOX_OAUTH_CLIENT_SECRET = Deno.env.get('ROBLOX_OAUTH_CLIENT_SECRET')! as OAuthClientSecret;

export const ROBLOX_OPEN_CLOUD_API_KEY = Deno.env.get('ROBLOX_OPEN_CLOUD_API_KEY')!;

export const ROBLOX_OAUTH_REDIRECT_URI_INVENTORY = '';