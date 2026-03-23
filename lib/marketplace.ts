import { createClient } from "@supabase/supabase-js";

import { normalizeHousingDetails } from "@/lib/housing";
import { mockListings, type Listing } from "@/lib/mock-data";
import {
  isSupabaseConfigured,
  supabaseAnonKey,
  supabaseUrl,
} from "@/lib/supabase/env";
import type {
  ItemCondition,
  ListingIntent,
  NegotiationMode,
} from "@/lib/listing-taxonomy";

export type MarketplaceSource = "mock" | "supabase";

type ListingRow = {
  id: string;
  owner_id: string | null;
  intent: ListingIntent | null;
  title: string;
  type: "service" | "product";
  category: string;
  focus: string | null;
  item_condition: ItemCondition | null;
  negotiation_mode: NegotiationMode | null;
  image_url: string | null;
  gallery_urls: string[] | null;
  location_note: string | null;
  housing_details: unknown | null;
  price: number | string;
  price_unit: string | null;
  campus: string | null;
  seller_name: string | null;
  seller_course: string | null;
  rating: number | string | null;
  delivery_mode: string | null;
  featured: boolean | null;
  description: string | null;
  tags: string[] | null;
};

function normalizeListing(row: ListingRow): Listing {
  return {
    id: row.id,
    sellerId: row.owner_id ?? undefined,
    intent: row.intent ?? "offer",
    title: row.title,
    type: row.type,
    category: row.category,
    focus: row.focus ?? undefined,
    itemCondition:
      row.type === "product" ? (row.item_condition ?? "used") : undefined,
    negotiationMode: row.negotiation_mode ?? "fixed",
    imageUrl: row.image_url ?? undefined,
    galleryUrls: row.gallery_urls ?? undefined,
    locationNote: row.location_note ?? undefined,
    housingDetails: normalizeHousingDetails(row.housing_details),
    price: Number(row.price),
    priceUnit: row.price_unit ?? undefined,
    campus: row.campus ?? "Campus a combinar",
    sellerName: row.seller_name ?? "Perfil universitario",
    sellerCourse: row.seller_course ?? "Comunidade academica",
    rating: row.rating ? Number(row.rating) : 4.7,
    deliveryMode: row.delivery_mode ?? "Combinado pelo campus",
    featured: Boolean(row.featured),
    description:
      row.description ?? "Anuncio carregado do Supabase sem descricao detalhada.",
    tags: row.tags ?? [],
  };
}

export async function getMarketplaceData(): Promise<{
  listings: Listing[];
  source: MarketplaceSource;
}> {
  return getMarketplaceDataWithOptions();
}

export async function getListingById(id: string): Promise<{
  listing: Listing | null;
  source: MarketplaceSource;
}> {
  const fallbackListing = mockListings.find((listing) => listing.id === id) ?? null;

  if (!isSupabaseConfigured()) {
    return {
      listing: fallbackListing,
      source: "mock",
    };
  }

  try {
    const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error } = await supabase
      .from("listings")
      .select(
        "id, owner_id, intent, title, type, category, focus, item_condition, negotiation_mode, image_url, gallery_urls, location_note, housing_details, price, price_unit, campus, seller_name, seller_course, rating, delivery_mode, featured, description, tags",
      )
      .eq("status", "active")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      return {
        listing: fallbackListing,
        source: fallbackListing ? "mock" : "supabase",
      };
    }

    return {
      listing: normalizeListing(data as ListingRow),
      source: "supabase",
    };
  } catch {
    return {
      listing: fallbackListing,
      source: fallbackListing ? "mock" : "supabase",
    };
  }
}

export async function getMarketplaceDataWithOptions(options?: {
  limit?: number;
}): Promise<{
  listings: Listing[];
  source: MarketplaceSource;
}> {
  const limit = options?.limit ?? 9;

  if (!isSupabaseConfigured()) {
    return {
      listings: mockListings.slice(0, limit),
      source: "mock",
    };
  }

  try {
    const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error } = await supabase
      .from("listings")
      .select(
        "id, owner_id, intent, title, type, category, focus, item_condition, negotiation_mode, image_url, gallery_urls, location_note, housing_details, price, price_unit, campus, seller_name, seller_course, rating, delivery_mode, featured, description, tags",
      )
      .eq("status", "active")
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data?.length) {
      return {
        listings: mockListings.slice(0, limit),
        source: "mock",
      };
    }

    return {
      listings: data.map((row) => normalizeListing(row as ListingRow)),
      source: "supabase",
    };
  } catch {
    return {
      listings: mockListings.slice(0, limit),
      source: "mock",
    };
  }
}
