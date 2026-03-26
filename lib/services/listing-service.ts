import type { SupabaseClient } from "@supabase/supabase-js";

import type { HousingDetails } from "@/lib/housing";
import type {
  ItemCondition,
  ListingIntent,
  ListingType,
  NegotiationMode,
} from "@/lib/listing-taxonomy";
import {
  getFeatureListingTokenCost,
  getListingCreationTokenCost,
  getRenewListingTokenCost,
} from "@/lib/monetization/token-costs";
import { grantMonthlyTokensIfEligible } from "@/lib/services/token-service";
import {
  listingSelect,
  normalizeListing,
  type ListingRow,
} from "@/lib/listings";

type SupabaseLike = SupabaseClient;

export type CreateListingInput = {
  sellerName: string;
  sellerCourse?: string | null;
  intent: ListingIntent;
  campus: string;
  type: ListingType;
  category: string;
  focus?: string | null;
  itemCondition?: ItemCondition | null;
  negotiationMode: NegotiationMode;
  imageUrl?: string | null;
  galleryUrls?: string[];
  locationNote?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
  housingDetails?: HousingDetails | null;
  title: string;
  description: string;
  price: number;
  priceUnit?: string | null;
  deliveryMode: string;
  tags: string[];
};

function pickReturnedListing(data: unknown) {
  if (Array.isArray(data)) {
    return data[0] ?? null;
  }

  return data ?? null;
}

export async function createListingWithTokens(params: {
  supabase: SupabaseLike;
  profileId: string;
  input: CreateListingInput;
}) {
  await grantMonthlyTokensIfEligible(params.supabase);

  const monetization = getListingCreationTokenCost(
    params.input.type,
    params.input.category,
  );

  // The RPC keeps listing creation + token debit in one transaction on the DB.
  const { data, error } = await params.supabase.rpc("create_listing_with_tokens", {
    target_profile_id: params.profileId,
    listing_payload: {
      seller_name: params.input.sellerName,
      seller_course: params.input.sellerCourse ?? null,
      intent: params.input.intent,
      campus: params.input.campus,
      type: params.input.type,
      category: params.input.category,
      focus: params.input.focus ?? null,
      item_condition:
        params.input.type === "product" ? (params.input.itemCondition ?? "used") : null,
      negotiation_mode: params.input.negotiationMode,
      image_url: params.input.imageUrl ?? null,
      gallery_urls: params.input.galleryUrls ?? [],
      location_note: params.input.locationNote ?? null,
      location_lat: params.input.locationLat ?? null,
      location_lng: params.input.locationLng ?? null,
      housing_details: params.input.housingDetails ?? null,
      title: params.input.title,
      description: params.input.description,
      price: params.input.price,
      price_unit: params.input.priceUnit ?? null,
      delivery_mode: params.input.deliveryMode,
      tags: params.input.tags,
      status: "active",
      featured: false,
    },
    requested_token_cost: monetization.amount,
    token_reason: monetization.reason,
    requested_listing_tier: monetization.tier,
  });

  if (error) {
    throw error;
  }

  const row = pickReturnedListing(data);

  return {
    listing: row ? normalizeListing(row as ListingRow) : null,
    monetization,
  };
}

export async function renewListingWithTokens(params: {
  supabase: SupabaseLike;
  profileId: string;
  listingId: string;
}) {
  await grantMonthlyTokensIfEligible(params.supabase);

  const monetization = getRenewListingTokenCost();
  const { data, error } = await params.supabase.rpc("renew_listing_with_tokens", {
    target_profile_id: params.profileId,
    target_listing_id: params.listingId,
    requested_token_cost: monetization.amount,
    token_reason: monetization.reason,
    days_to_extend: 30,
  });

  if (error) {
    throw error;
  }

  const row = pickReturnedListing(data);

  return {
    listing: row ? normalizeListing(row as ListingRow) : null,
    monetization,
  };
}

export async function featureListingWithTokens(params: {
  supabase: SupabaseLike;
  profileId: string;
  listingId: string;
}) {
  await grantMonthlyTokensIfEligible(params.supabase);

  const monetization = getFeatureListingTokenCost();
  const { data, error } = await params.supabase.rpc("feature_listing_with_tokens", {
    target_profile_id: params.profileId,
    target_listing_id: params.listingId,
    requested_token_cost: monetization.amount,
    token_reason: monetization.reason,
    feature_days: 7,
  });

  if (error) {
    throw error;
  }

  const row = pickReturnedListing(data);

  return {
    listing: row ? normalizeListing(row as ListingRow) : null,
    monetization,
  };
}

export { listingSelect };
