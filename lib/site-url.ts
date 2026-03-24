type SiteUrlOptions = {
  preferBrowserOrigin?: boolean;
};

function normalizeSiteUrl(siteUrl?: string | null) {
  if (!siteUrl) {
    return null;
  }

  return siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`;
}

function shouldPreferBrowserOrigin(siteUrl?: string | null) {
  if (!siteUrl) {
    return true;
  }

  return /localhost|127\.0\.0\.1/i.test(siteUrl);
}

export function getSiteUrl(options: SiteUrlOptions = {}) {
  const envSiteUrl = normalizeSiteUrl(
    process.env.NEXT_PUBLIC_SITE_URL ??
      process.env.VERCEL_PROJECT_PRODUCTION_URL ??
      process.env.VERCEL_URL,
  );
  const preferBrowserOrigin = options.preferBrowserOrigin ?? false;

  if (typeof window !== "undefined") {
    const browserOrigin = normalizeSiteUrl(window.location.origin);

    if (browserOrigin && (preferBrowserOrigin || shouldPreferBrowserOrigin(envSiteUrl))) {
      return browserOrigin;
    }

    if (browserOrigin && !envSiteUrl) {
      return browserOrigin;
    }
  }

  return envSiteUrl ?? "http://localhost:3000";
}

export function getAuthCallbackUrl(next = "/") {
  const safeNext = next.startsWith("/") ? next : "/";
  const callbackUrl = new URL(
    "/auth/callback",
    getSiteUrl({ preferBrowserOrigin: true }),
  );

  callbackUrl.searchParams.set("next", safeNext);

  return callbackUrl.toString();
}
