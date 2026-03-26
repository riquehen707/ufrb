"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { MobileDock, MobileDockFallback } from "@/components/shell/mobile-dock";
import { InstallAppButton } from "@/components/engagement/install-app-button";
import {
  desktopNavItems,
  isRouteActive,
} from "@/components/shell/navigation-config";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { TokenBalanceChip } from "@/components/tokens/token-balance-chip";
import type { PlanType } from "@/lib/monetization/types";

type Props = {
  accountSummary?: {
    tokenBalance: number;
    planType: PlanType;
  } | null;
};

export function SiteHeader({ accountSummary = null }: Props) {
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
            <InstallAppButton
              className="shell-install-cta"
              hiddenWhenInstalled
              labelOverride="Instalar"
            />
            {accountSummary ? (
              <TokenBalanceChip
                tokenBalance={accountSummary.tokenBalance}
                planType={accountSummary.planType}
                className="shell-token-chip"
              />
            ) : null}
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
