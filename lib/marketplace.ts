import { createClient } from "@supabase/supabase-js";

import {
  listingSelect,
  normalizeListing,
  type Listing,
  type ListingRow,
} from "@/lib/listings";
import {
  isSupabaseConfigured,
  supabaseAnonKey,
  supabaseUrl,
} from "@/lib/supabase/env";

export type MarketplaceSource = "supabase" | "empty";

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
  if (!isSupabaseConfigured()) {
    return {
      listing: null,
      source: "empty",
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
      .select(listingSelect)
      .eq("status", "active")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      return {
        listing: null,
        source: "empty",
      };
    }

    return {
      listing: normalizeListing(data as ListingRow),
      source: "supabase",
    };
  } catch {
    return {
      listing: null,
      source: "empty",
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
      listings: [],
      source: "empty",
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
      .select(listingSelect)
      .eq("status", "active")
      .order("featured", { ascending: false })
      .order("priority_boost", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) {
      return {
        listings: [],
        source: "empty",
      };
    }

    return {
      listings: data.map((row) => normalizeListing(row as ListingRow)),
      source: data.length ? "supabase" : "empty",
    };
  } catch {
    return {
      listings: [],
      source: "empty",
    };
  }
}
