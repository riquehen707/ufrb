import { InstallPrompt } from "@/components/engagement/install-prompt";
import { SignupCard } from "@/components/engagement/signup-card";
import { HomeCategoryCarousel } from "@/components/home/home-category-carousel";
import { HomeHero } from "@/components/home/home-hero";
import { HomeStoryRail } from "@/components/home/home-story-rail";
import { PageShell } from "@/components/shell/page-shell";

export default function Home() {
  return (
    <PageShell>
      <>
        <HomeHero />
        <HomeCategoryCarousel />
        <HomeStoryRail />

        <section className="section home-utility-section">
          <div className="container home-utility-grid">
            <SignupCard />
            <InstallPrompt />
          </div>
        </section>
      </>
    </PageShell>
  );
}
