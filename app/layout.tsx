import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";

import { InstallProvider } from "@/components/engagement/install-provider";
import { getSiteUrl } from "@/lib/site-url";

import "./globals.css";

const bodyFont = Inter({
  subsets: ["latin"],
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
    "Rede universitaria de oportunidades para renda, troca, autonomia e vida pratica no campus.",
  applicationName: "CAMPUS",
  keywords: [
    "rede universitaria",
    "UFRB",
    "oportunidades estudantis",
    "servicos entre estudantes",
    "renda extra universitaria",
    "campus",
    "vida universitaria",
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
      "Uma rede universitaria para ensinar, vender, prestar servicos, dividir moradia e resolver a vida no campus.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CAMPUS",
    description:
      "Renda, troca, estudo e autonomia no mesmo ecossistema universitario.",
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
    { media: "(prefers-color-scheme: light)", color: "#fff1f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1117" },
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
      data-theme="light"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${bodyFont.variable} ${displayFont.variable}`}
    >
      <body>
        <InstallProvider>{children}</InstallProvider>
      </body>
    </html>
  );
}
