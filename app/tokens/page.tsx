import type { Metadata } from "next";

import { TokenHub } from "@/components/tokens/token-hub";
import { PageShell } from "@/components/shell/page-shell";
import { getCurrentTokenDashboard } from "@/lib/token-dashboard";

export const metadata: Metadata = {
  title: "Planos e Tokens",
  description: "Saldo, historico e compra de tokens no CAMPUS.",
};

export default async function TokensPage() {
  const dashboard = await getCurrentTokenDashboard();

  return (
    <PageShell mainClassName="section">
      <div className="container page-stack">
        <TokenHub dashboard={dashboard} />
      </div>
    </PageShell>
  );
}
