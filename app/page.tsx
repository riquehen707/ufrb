import { InstallPrompt } from "@/components/engagement/install-prompt";
import { SignupCard } from "@/components/engagement/signup-card";
import { HomeCategoryCarousel } from "@/components/home/home-category-carousel";
import { HomeHero } from "@/components/home/home-hero";
import { HomePurposeStrip } from "@/components/home/home-purpose-strip";
import { PageShell } from "@/components/shell/page-shell";
import { getMarketplaceData } from "@/lib/marketplace";

export default async function Home() {
  const marketplace = await getMarketplaceData();

  return (
    <PageShell>
      <>
        <HomeHero listings={marketplace.listings} />
        <HomeCategoryCarousel />

        <section className="section home-utility-section" id="baixar-app">
          <div className="container home-utility-grid">
            <InstallPrompt />
            <SignupCard />
          </div>
        </section>

        <HomePurposeStrip />
      </>
    </PageShell>
  );
}
