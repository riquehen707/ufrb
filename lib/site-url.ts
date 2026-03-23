export function getSiteUrl() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL;

  if (!siteUrl) {
    return "http://localhost:3000";
  }

  return siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`;
}
