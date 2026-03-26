import type { ReactNode } from "react";

import { SiteFooter } from "@/components/shell/site-footer";
import { SiteHeader } from "@/components/shell/site-header";
import { getCurrentProfile } from "@/lib/profiles";

type Props = {
  children: ReactNode;
  mainClassName?: string;
};

export async function PageShell({ children, mainClassName }: Props) {
  const { profile } = await getCurrentProfile();

  return (
    <div className="app-shell">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <SiteHeader
        accountSummary={
          profile
            ? {
                tokenBalance: profile.tokenBalance,
                planType: profile.planType,
              }
            : null
        }
      />
      <main className={mainClassName}>{children}</main>
      <SiteFooter />
    </div>
  );
}
