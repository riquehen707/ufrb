import type { Metadata } from "next";

import { AuthPanel } from "@/components/auth/auth-panel";
import { PageShell } from "@/components/shell/page-shell";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Entrar ou criar conta no CAMPUS.",
};

export default function AuthPage() {
  return (
    <PageShell mainClassName="section">
      <div className="container page-stack">
        <AuthPanel />
      </div>
    </PageShell>
  );
}
