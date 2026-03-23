import type { ReactNode } from "react";

import { SiteFooter } from "@/components/shell/site-footer";
import { SiteHeader } from "@/components/shell/site-header";

type Props = {
  children: ReactNode;
  mainClassName?: string;
};

export function PageShell({ children, mainClassName }: Props) {
  return (
    <div className="app-shell">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <SiteHeader />
      <main className={mainClassName}>{children}</main>
      <SiteFooter />
    </div>
  );
}
