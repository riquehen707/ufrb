"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

import {
  defaultNavigationContext,
  fixedMobileNavItems,
  getNavigationContext,
  isRouteActive,
} from "@/components/shell/navigation-config";

export function MobileDock() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const routeKey = searchParamsString ? `${pathname}?${searchParamsString}` : pathname;
  const [openRouteKey, setOpenRouteKey] = useState<string | null>(null);
  const actionContext = getNavigationContext({ pathname, searchParams });
  const ActionIcon = actionContext.icon;
  const canOpenMenu = actionContext.actions.length > 0;
  const isMenuOpen = openRouteKey === routeKey;

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenRouteKey(null);
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [isMenuOpen]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = previousOverflow;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMenuOpen]);

  return (
    <>
      {canOpenMenu ? (
        <>
          <div
            className={`mobile-action-backdrop ${isMenuOpen ? "active" : ""}`}
            onClick={() => setOpenRouteKey(null)}
            aria-hidden="true"
          />

          <div
            id="mobile-action-sheet"
            className={`mobile-action-sheet ${isMenuOpen ? "active" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-action-sheet-title"
            aria-hidden={!isMenuOpen}
          >
            <div className="mobile-action-sheet-header">
              <div className="mobile-action-sheet-copy">
                <span className="mobile-action-sheet-eyebrow">{actionContext.label}</span>
                <strong id="mobile-action-sheet-title">{actionContext.title}</strong>
                <p>{actionContext.description}</p>
              </div>

              <button
                type="button"
                className="mobile-action-close"
                onClick={() => setOpenRouteKey(null)}
                aria-label="Fechar menu de acoes"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mobile-action-list">
              {actionContext.actions.map(({ href, label, description, icon: Icon }) => (
                <Link
                  key={`${href}-${label}`}
                  href={href}
                  className="mobile-action-link"
                  onClick={() => setOpenRouteKey(null)}
                >
                  <span className="mobile-action-link-icon">
                    <Icon size={18} />
                  </span>
                  <span className="mobile-action-link-copy">
                    <strong>{label}</strong>
                    <span>{description}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </>
      ) : null}

      <nav className="mobile-dock" aria-label="Navegacao principal no celular">
        {fixedMobileNavItems.slice(0, 2).map(({ href, label, icon: Icon, match }) => {
          const active = isRouteActive(pathname, { match });

          return (
            <Link
              key={href}
              href={href}
              className={`mobile-dock-link ${active ? "active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <span className="mobile-dock-link-icon">
                <Icon size={18} />
              </span>
              <span className="mobile-dock-link-label">{label}</span>
            </Link>
          );
        })}

        {canOpenMenu ? (
          <button
            type="button"
            className={`mobile-dock-action ${isMenuOpen ? "active" : ""}`}
            onClick={() =>
              setOpenRouteKey((current) => (current === routeKey ? null : routeKey))
            }
            aria-expanded={isMenuOpen}
            aria-controls="mobile-action-sheet"
          >
            <span className="mobile-dock-action-orb">
              <ActionIcon size={20} />
            </span>
            <span className="mobile-dock-action-copy">
              <strong>{actionContext.label}</strong>
              <span>menu</span>
            </span>
          </button>
        ) : (
          <div className="mobile-dock-action mobile-dock-action-static" aria-hidden="true">
            <span className="mobile-dock-action-orb">
              <ActionIcon size={20} />
            </span>
            <span className="mobile-dock-action-copy">
              <strong>{actionContext.label}</strong>
            </span>
          </div>
        )}

        {fixedMobileNavItems.slice(2).map(({ href, label, icon: Icon, match }) => {
          const active = isRouteActive(pathname, { match });

          return (
            <Link
              key={href}
              href={href}
              className={`mobile-dock-link ${active ? "active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <span className="mobile-dock-link-icon">
                <Icon size={18} />
              </span>
              <span className="mobile-dock-link-label">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export function MobileDockFallback() {
  const ActionIcon = defaultNavigationContext.icon;

  return (
    <nav className="mobile-dock" aria-label="Navegacao principal no celular">
      {fixedMobileNavItems.slice(0, 2).map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} className="mobile-dock-link">
          <span className="mobile-dock-link-icon">
            <Icon size={18} />
          </span>
          <span className="mobile-dock-link-label">{label}</span>
        </Link>
      ))}

      <div className="mobile-dock-action mobile-dock-action-static" aria-hidden="true">
        <span className="mobile-dock-action-orb">
          <ActionIcon size={20} />
        </span>
        <span className="mobile-dock-action-copy">
          <strong>{defaultNavigationContext.label}</strong>
        </span>
      </div>

      {fixedMobileNavItems.slice(2).map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} className="mobile-dock-link">
          <span className="mobile-dock-link-icon">
            <Icon size={18} />
          </span>
          <span className="mobile-dock-link-label">{label}</span>
        </Link>
      ))}
    </nav>
  );
}
