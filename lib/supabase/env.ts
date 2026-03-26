export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
export const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const listingMediaBucket =
  process.env.NEXT_PUBLIC_SUPABASE_LISTING_BUCKET ?? "listing-media";

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}
