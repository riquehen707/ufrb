import type { Listing } from "@/lib/listings";

export type ListingPerformanceSnapshot = {
  activeOffers: number;
  activeRequests: number;
  activeCategories: number;
  potentialGross: number;
  productPotential: number;
  servicePotential: number;
  requestBudget: number;
  averageOfferTicket: number;
};

export function summarizeListingPerformance(
  listings: Listing[],
): ListingPerformanceSnapshot {
  const activeOffers = listings.filter((listing) => listing.intent === "offer");
  const activeRequests = listings.filter((listing) => listing.intent === "request");
  const productOffers = activeOffers.filter((listing) => listing.type === "product");
  const serviceOffers = activeOffers.filter((listing) => listing.type === "service");
  const potentialGross = activeOffers.reduce(
    (total, listing) => total + listing.price,
    0,
  );
  const productPotential = productOffers.reduce(
    (total, listing) => total + listing.price,
    0,
  );
  const servicePotential = serviceOffers.reduce(
    (total, listing) => total + listing.price,
    0,
  );
  const requestBudget = activeRequests.reduce(
    (total, listing) => total + listing.price,
    0,
  );

  return {
    activeOffers: activeOffers.length,
    activeRequests: activeRequests.length,
    activeCategories: new Set(listings.map((listing) => listing.category)).size,
    potentialGross,
    productPotential,
    servicePotential,
    requestBudget,
    averageOfferTicket: activeOffers.length
      ? Number((potentialGross / activeOffers.length).toFixed(2))
      : 0,
  };
}
