import type { Metadata } from "next";

import { PageShell } from "@/components/shell/page-shell";
import { WorkHub } from "@/components/trabalhos/work-hub";
import { normalizeWorkTab } from "@/lib/work-hub";

type TrabalhosPageProps = {
  searchParams: Promise<{
    aba?: string | string[] | undefined;
  }>;
};

export const metadata: Metadata = {
  title: "Trabalhos",
  description:
    "Transporte comunitario, aulas e servicos gerais com uma experiencia mais estruturada e mobile-first.",
};

function readSingleValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TrabalhosPage({
  searchParams,
}: TrabalhosPageProps) {
  const params = await searchParams;
  const initialTab = normalizeWorkTab(readSingleValue(params.aba));

  return (
    <PageShell mainClassName="section">
      <div className="container">
        <WorkHub initialTab={initialTab} />
      </div>
    </PageShell>
  );
}
