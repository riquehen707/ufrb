import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Sora } from "next/font/google";

import { getSiteUrl } from "@/lib/site-url";

import "./globals.css";

const bodyFont = Plus_Jakarta_Sans({
  subsets: ["latin-ext"],
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
  variable: "--font-body",
});

const displayFont = Sora({
  subsets: ["latin-ext"],
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
  variable: "--font-display",
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "CAMPUS",
    template: "%s | CAMPUS",
  },
  description:
    "Marketplace universitário para produtos, moradia, aulas, transporte e demandas da vida no campus.",
  applicationName: "CAMPUS",
  keywords: [
    "marketplace universitário",
    "UFRB",
    "serviços estudantis",
    "produtos universitários",
    "campus",
    "achados universitários",
  ],
  category: "education",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "CAMPUS",
    title: "CAMPUS",
    description:
      "Produtos, moradia, aulas, transporte e demandas com leitura rápida e cara de marketplace universitário.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CAMPUS",
    description:
      "Compra, vende, anuncia e pede no mesmo feed, com visual mais limpo e leitura rápida.",
  },
  appleWebApp: {
    capable: true,
    title: "CAMPUS",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#6d4aff" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1020" },
  ],
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      data-theme="dark"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${bodyFont.variable} ${displayFont.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
