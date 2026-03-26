import type { Metadata } from "next";

import { ListingComposer } from "@/components/marketplace/listing-composer";
import { PageShell } from "@/components/shell/page-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import {
  getCategoriesForType,
  type ListingIntent,
  type ListingType,
} from "@/lib/listing-taxonomy";
import { getCurrentProfile } from "@/lib/profiles";

type PublishPageProps = {
  searchParams: Promise<{
    intent?: string | string[] | undefined;
    type?: string | string[] | undefined;
    category?: string | string[] | undefined;
  }>;
};

export const metadata: Metadata = {
  title: "Anunciar",
  description: "Criar oferta ou demanda no CAMPUS.",
};

function readSingleValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function readIntent(value?: string | string[]): ListingIntent | undefined {
  const single = readSingleValue(value);
  return single === "offer" || single === "request" ? single : undefined;
}

function readType(value?: string | string[]): ListingType | undefined {
  const single = readSingleValue(value);
  return single === "product" || single === "service" ? single : undefined;
}

function normalizeLookupValue(value?: string) {
  return value
    ?.normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase() ?? "";
}

function readCategory(
  value: string | string[] | undefined,
  type: ListingType,
) {
  const single = readSingleValue(value);

  if (!single) {
    return undefined;
  }

  return getCategoriesForType(type).find(
    (category) => normalizeLookupValue(category) === normalizeLookupValue(single),
  );
}

export default async function PublishPage({ searchParams }: PublishPageProps) {
  const params = await searchParams;
  const { profile } = await getCurrentProfile();
  const initialIntent = readIntent(params.intent);
  const initialType = readType(params.type);
  const resolvedType = initialType ?? "service";
  const initialCategory = readCategory(params.category, resolvedType);

  return (
    <PageShell mainClassName="section">
      <div className="container page-stack">
        <section className="create-grid">
          <SectionHeading
            eyebrow="Anunciar no CAMPUS"
            title="Criar anuncio"
            description="Oferta ou demanda no feed."
            titleAs="h1"
          />
        </section>

        <ListingComposer
          key={`${initialIntent ?? "offer"}-${resolvedType}-${initialCategory ?? "default"}`}
          initialIntent={initialIntent}
          initialType={initialType}
          initialCategory={initialCategory}
          tokenSummary={
            profile
              ? {
                  tokenBalance: profile.tokenBalance,
                  planType: profile.planType,
                }
              : null
          }
        />
      </div>
    </PageShell>
  );
}
