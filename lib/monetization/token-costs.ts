import type { ListingType } from "@/lib/listing-taxonomy";
import type { ListingTier, TokenTransactionReason } from "@/lib/monetization/types";

export const TOKEN_COSTS = {
  listing: {
    simple: 1,
    premium: 2,
  },
  renewal: 1,
  featured: 1,
} as const;

export function getListingTierForMonetization(
  type: ListingType,
  category: string,
): ListingTier {
  // Transporte segue como anuncio simples para manter caronas acessiveis.
  if (type === "product") {
    return "simple";
  }

  if (category === "Transporte comunitario") {
    return "simple";
  }

  // O restante dos servicos usa tier premium porque tende a gerar mais valor.
  return "premium";
}

export function getListingCreationTokenCost(
  type: ListingType,
  category: string,
) {
  const tier = getListingTierForMonetization(type, category);

  return {
    tier,
    amount: TOKEN_COSTS.listing[tier],
    reason: getListingCreationReason(tier),
  } as const;
}

export function getListingCreationReason(
  tier: ListingTier,
): TokenTransactionReason {
  return tier === "premium" ? "listing_create_premium" : "listing_create_simple";
}

export function getRenewListingTokenCost() {
  return {
    amount: TOKEN_COSTS.renewal,
    reason: "listing_renewal" as TokenTransactionReason,
  };
}

export function getFeatureListingTokenCost() {
  return {
    amount: TOKEN_COSTS.featured,
    reason: "listing_featured" as TokenTransactionReason,
  };
}
