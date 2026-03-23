import type { Metadata } from "next";

import { DonationForm } from "@/components/donation/donation-form";
import { DonationSupportWall } from "@/components/donation/donation-support-wall";
import { PageShell } from "@/components/shell/page-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { getDonationOverview } from "@/lib/donations";

export const metadata: Metadata = {
  title: "Doar",
  description: "Apoio confirmado e mural de apoiadores do CAMPUS.",
};

export default async function DonatePage() {
  const overview = await getDonationOverview();

  return (
    <PageShell mainClassName="section">
      <div className="container page-stack">
        <section>
          <SectionHeading
            eyebrow="Apoio"
            title="Apoiar o CAMPUS"
            description="Apoio confirmado entra no teu perfil e pode aparecer entre os apoiadores."
            titleAs="h1"
          />
        </section>

        <DonationForm />
        <DonationSupportWall overview={overview} />
      </div>
    </PageShell>
  );
}
