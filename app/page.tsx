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

        <section className="section home-account-section">
          <div className="container home-account-grid">
            <SignupCard />
          </div>
        </section>
      </>
    </PageShell>
  );
}
