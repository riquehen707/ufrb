import { MarketplaceExplorer } from "@/components/marketplace/marketplace-explorer";
import { PageShell } from "@/components/shell/page-shell";
import { getMarketplaceDataWithOptions } from "@/lib/marketplace";

export default async function Home() {
  const marketplace = await getMarketplaceDataWithOptions({ limit: 24 });
  const homeListings = marketplace.listings.filter(
    (listing) => listing.type === "product" && listing.intent === "offer",
  );

  return (
    <PageShell mainClassName="section">
      <div className="container catalog-page-shell">
        <MarketplaceExplorer
          listings={homeListings}
          initialState={{
            workspace: "consumer",
            type: "product",
            intent: "offer",
          }}
          headingOverride={{
            eyebrow: "",
            title: "O que ja esta rolando no campus",
            description:
              "Livros, eletronicos, moradia e outras oportunidades com filtros mais diretos.",
          }}
          hideWorkspaceSwitch
          hidePrimaryAction
          lockedWorkspace="consumer"
          chromeMode="minimal"
        />
      </div>
    </PageShell>
  );
}
