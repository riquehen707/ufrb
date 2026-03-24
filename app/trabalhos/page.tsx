import type { Metadata } from "next";

import { PageShell } from "@/components/shell/page-shell";
import { WorkHub } from "@/components/trabalhos/work-hub";
import { getMarketplaceDataWithOptions } from "@/lib/marketplace";
import { bucketWorkListings, normalizeWorkTab } from "@/lib/work-hub";

type TrabalhosPageProps = {
  searchParams: Promise<{
    aba?: string | string[] | undefined;
  }>;
};

export const metadata: Metadata = {
  title: "Trabalhos",
  description:
    "Aulas, transporte e servicos conectados a oportunidades reais da vida universitaria.",
};

function readSingleValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TrabalhosPage({
  searchParams,
}: TrabalhosPageProps) {
  const params = await searchParams;
  const initialTab = normalizeWorkTab(readSingleValue(params.aba));
  const marketplace = await getMarketplaceDataWithOptions({ limit: 60 });
  const workListings = bucketWorkListings(
    marketplace.listings.filter((listing) => listing.type === "service"),
  );

  return (
    <PageShell mainClassName="section">
      <div className="container">
        <WorkHub
          initialTab={initialTab}
          classListings={workListings.aulas}
          transportListings={workListings.transporte}
          serviceListings={workListings.servicos}
        />
      </div>
    </PageShell>
  );
}
