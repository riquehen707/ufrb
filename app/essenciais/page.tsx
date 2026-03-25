import type { Metadata } from "next";

import { EssentialsHub } from "@/components/essentials/essentials-hub";
import { PageShell } from "@/components/shell/page-shell";
import { getMarketplaceDataWithOptions } from "@/lib/marketplace";

export const metadata: Metadata = {
  title: "Essenciais",
  description:
    "Grupos, moradia e transporte em um lugar mais estrategico dentro do CAMPUS.",
};

function normalizeCategory(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export default async function EssentialsPage() {
  const marketplace = await getMarketplaceDataWithOptions({ limit: 60 });
  const listings = marketplace.listings.filter((listing) => listing.intent === "offer");

  const studyListings = listings
    .filter((listing) => normalizeCategory(listing.category) === "aulas e monitoria")
    .slice(0, 10);
  const housingListings = listings
    .filter((listing) => listing.category === "Moradia")
    .slice(0, 10);
  const transportListings = listings
    .filter((listing) => normalizeCategory(listing.category) === "transporte comunitario")
    .slice(0, 10);

  return (
    <PageShell mainClassName="section">
      <div className="container">
        <EssentialsHub
          studyListings={studyListings}
          housingListings={housingListings}
          transportListings={transportListings}
        />
      </div>
    </PageShell>
  );
}
