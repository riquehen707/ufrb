export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
export const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const donationPixKey = process.env.NEXT_PUBLIC_DONATION_PIX_KEY;
export const donationPixName =
  process.env.NEXT_PUBLIC_DONATION_PIX_NAME ?? "CAMPUS";
export const donationWebhookSecret = process.env.DONATION_WEBHOOK_SECRET;
export const listingMediaBucket =
  process.env.NEXT_PUBLIC_SUPABASE_LISTING_BUCKET ?? "listing-media";
export const picpayApiBaseUrl =
  process.env.PICPAY_API_BASE_URL ?? "https://checkout-api.picpay.com";
export const picpayClientId = process.env.PICPAY_CLIENT_ID;
export const picpayClientSecret = process.env.PICPAY_CLIENT_SECRET;
export const picpayWebhookToken = process.env.PICPAY_WEBHOOK_TOKEN;

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function isPicPayConfigured() {
  return Boolean(picpayClientId && picpayClientSecret);
}
