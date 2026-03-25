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
            title: "Catalogo do campus",
            description:
              "Produtos, moradia e oportunidades publicadas agora.",
          }}
          hideWorkspaceSwitch
          hidePrimaryAction
          lockedWorkspace="consumer"
          chromeMode="minimal"
          layoutMode="lanes"
        />
      </div>
    </PageShell>
  );
}
