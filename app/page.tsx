import { HomeCatalog } from "@/components/home/home-catalog";
import { PageShell } from "@/components/shell/page-shell";
import { isHousingCategory } from "@/lib/housing";
import { getMarketplaceDataWithOptions } from "@/lib/marketplace";

export default async function Home() {
  const marketplace = await getMarketplaceDataWithOptions({ limit: 60 });
  const listings = marketplace.listings.filter((listing) => listing.intent === "offer");

  const normalizeCategory = (value?: string | null) =>
    (value ?? "")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase();

  const productListings = listings
    .filter(
      (listing) =>
        listing.type === "product" && !isHousingCategory(listing.category),
    )
    .slice(0, 12);
  const housingListings = listings
    .filter((listing) => isHousingCategory(listing.category))
    .slice(0, 12);
  const classListings = listings
    .filter(
      (listing) => normalizeCategory(listing.category) === "aulas e monitoria",
    )
    .slice(0, 12);
  const serviceListings = listings
    .filter(
      (listing) =>
        listing.type === "service" &&
        normalizeCategory(listing.category) !== "aulas e monitoria" &&
        normalizeCategory(listing.category) !== "transporte comunitario",
    )
    .slice(0, 12);

  return (
    <PageShell mainClassName="section">
      <div className="container catalog-page-shell">
        <HomeCatalog
          productListings={productListings}
          housingListings={housingListings}
          classListings={classListings}
          serviceListings={serviceListings}
        />
      </div>
    </PageShell>
  );
}
