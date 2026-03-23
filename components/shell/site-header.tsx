"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { MobileDock, MobileDockFallback } from "@/components/shell/mobile-dock";
import {
  desktopNavItems,
  isRouteActive,
} from "@/components/shell/navigation-config";
import { ThemeToggle } from "@/components/shell/theme-toggle";

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <>
      <header className="shell-header">
        <div className="container shell-header-bar">
          <Link href="/" className="shell-header-brand">
            <span className="brand-mark">C</span>
            <span className="brand">
              <span>
                <strong>CAMPUS</strong>
              </span>
            </span>
          </Link>

          <nav className="shell-header-nav" aria-label="Navegacao principal">
            {desktopNavItems.map(({ href, label, icon: Icon, match }) => {
              const active = isRouteActive(pathname, { match });

              return (
                <Link
                  key={href}
                  href={href}
                  className={`shell-nav-link ${active ? "active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="shell-nav-link-icon">
                    <Icon size={15} />
                  </span>
                  <span className="shell-nav-link-copy">
                    <span className="shell-nav-link-label">{label}</span>
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="shell-header-actions">
            <Link href="/perfil" className="shell-header-badge">
              Conta
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <Suspense fallback={<MobileDockFallback />}>
        <MobileDock />
      </Suspense>
    </>
  );
}
