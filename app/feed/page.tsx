import type { Metadata } from "next";

import { MarketplaceExplorer } from "@/components/marketplace/marketplace-explorer";
import { PageShell } from "@/components/shell/page-shell";
import { getMarketplaceDataWithOptions } from "@/lib/marketplace";

type FeedPageProps = {
  searchParams: Promise<{
    publicado?: string | string[] | undefined;
    q?: string | string[] | undefined;
    mode?: string | string[] | undefined;
    type?: string | string[] | undefined;
    intent?: string | string[] | undefined;
    category?: string | string[] | undefined;
    focus?: string | string[] | undefined;
    condition?: string | string[] | undefined;
    housing_gender?: string | string[] | undefined;
    housing_payment_day?: string | string[] | undefined;
    housing_garage?: string | string[] | undefined;
    sort?: string | string[] | undefined;
  }>;
};

export const metadata: Metadata = {
  title: "Feed",
  description: "Oportunidades reais entre estudantes no CAMPUS.",
};

function readSingleValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function readType(value?: string | string[]): "all" | "product" | "service" {
  const single = readSingleValue(value);
  return single === "product" || single === "service" ? single : "all";
}

function readWorkspace(value?: string | string[]): "consumer" | "seller" | undefined {
  const single = readSingleValue(value);
  return single === "consumer" || single === "seller" ? single : undefined;
}

function readIntent(value?: string | string[]): "all" | "offer" | "request" {
  const single = readSingleValue(value);
  return single === "offer" || single === "request" ? single : "all";
}

function readCondition(value?: string | string[]): "all" | "new" | "used" {
  const single = readSingleValue(value);
  return single === "new" || single === "used" ? single : "all";
}

function readSort(
  value?: string | string[],
): "relevance" | "price_asc" | "price_desc" | "rating" {
  const single = readSingleValue(value);
  return single === "price_asc" ||
    single === "price_desc" ||
    single === "rating"
    ? single
    : "relevance";
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const marketplace = await getMarketplaceDataWithOptions({ limit: 18 });
  const query = await searchParams;
  const hasNewListing = readSingleValue(query.publicado) === "1";
  const initialExplorerState = {
    query: readSingleValue(query.q) ?? "",
    workspace: readWorkspace(query.mode),
    type: readType(query.type),
    intent: readIntent(query.intent),
    category: readSingleValue(query.category) ?? "all",
    focus: readSingleValue(query.focus) ?? "all",
    condition: readCondition(query.condition),
    housingGender:
      (readSingleValue(query.housing_gender) as
        | "all"
        | "any"
        | "women"
        | "men"
        | "mixed"
        | undefined) ?? "all",
    housingPaymentDay: readSingleValue(query.housing_payment_day) ?? "all",
    housingGarage:
      readSingleValue(query.housing_garage) === "with_garage"
        ? "with_garage"
        : "all",
    sort: readSort(query.sort),
  } as const;
  return (
    <PageShell mainClassName="section">
      <div className="container catalog-page-shell">
        <MarketplaceExplorer
          listings={marketplace.listings}
          initialState={initialExplorerState}
          syncUrlPath="/feed"
          persistedParams={{
            publicado: hasNewListing ? "1" : undefined,
          }}
          publishedNotice={hasNewListing}
          layoutMode="lanes"
        />
      </div>
    </PageShell>
  );
}
