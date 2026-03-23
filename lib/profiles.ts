import { createClient, type User } from "@supabase/supabase-js";

import {
  listingSelect,
  normalizeListing,
  type Listing,
  type ListingRow,
} from "@/lib/listings";
import { slugifyProfileId } from "@/lib/location";
import {
  isSupabaseConfigured,
  supabaseAnonKey,
  supabaseUrl,
} from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PublicProfile = {
  id: string;
  fullName: string;
  university: string;
  campus: string;
  accountType: string;
  course?: string;
  bio?: string;
  headline?: string;
  specialties: string[];
  avatarUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  instagramHandle?: string;
  verifiedStudent: boolean;
  reliabilityScore: number;
  productRating: number;
  serviceRating: number;
  transportRating: number;
  housingRating: number;
  housingReviewCount: number;
  supportBalance: number;
  supportCount: number;
  reviewCount: number;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  university: string | null;
  campus: string | null;
  account_type: string | null;
  course: string | null;
  bio: string | null;
  headline: string | null;
  specialties: string[] | null;
  avatar_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  instagram_handle: string | null;
  verified_student: boolean | null;
  reliability_score: number | string | null;
  product_rating: number | string | null;
  service_rating: number | string | null;
  transport_rating: number | string | null;
  housing_rating: number | string | null;
  housing_review_count: number | null;
  support_balance: number | string | null;
  support_count: number | null;
  review_count: number | null;
};

const profileSelect =
  "id, full_name, university, campus, account_type, course, bio, headline, specialties, avatar_url, contact_email, contact_phone, instagram_handle, verified_student, reliability_score, product_rating, service_rating, transport_rating, housing_rating, housing_review_count, support_balance, support_count, review_count";

function normalizeProfile(row: ProfileRow): PublicProfile {
  return {
    id: row.id,
    fullName: row.full_name ?? "Perfil CAMPUS",
    university: row.university ?? "UFRB",
    campus: row.campus ?? "Cruz das Almas",
    accountType: row.account_type ?? "buyer",
    course: row.course ?? undefined,
    bio: row.bio ?? undefined,
    headline: row.headline ?? undefined,
    specialties: row.specialties ?? [],
    avatarUrl: row.avatar_url ?? undefined,
    contactEmail: row.contact_email ?? undefined,
    contactPhone: row.contact_phone ?? undefined,
    instagramHandle: row.instagram_handle ?? undefined,
    verifiedStudent: Boolean(row.verified_student),
    reliabilityScore: row.reliability_score ? Number(row.reliability_score) : 5,
    productRating: row.product_rating ? Number(row.product_rating) : 5,
    serviceRating: row.service_rating ? Number(row.service_rating) : 5,
    transportRating: row.transport_rating ? Number(row.transport_rating) : 5,
    housingRating: row.housing_rating ? Number(row.housing_rating) : 0,
    housingReviewCount: row.housing_review_count ?? 0,
    supportBalance: row.support_balance ? Number(row.support_balance) : 0,
    supportCount: row.support_count ?? 0,
    reviewCount: row.review_count ?? 0,
  };
}

function isVerifiedStudentEmail(email?: string | null) {
  return email ? /@ufrb\.edu\.br$/i.test(email) : false;
}

function buildCurrentProfileFallback(user: User): PublicProfile {
  return {
    id: user.id,
    fullName:
      (user.user_metadata?.full_name as string | undefined) ??
      user.email?.split("@")[0] ??
      "Perfil CAMPUS",
    university: (user.user_metadata?.university as string | undefined) ?? "UFRB",
    campus: (user.user_metadata?.campus as string | undefined) ?? "Cruz das Almas",
    accountType: (user.user_metadata?.account_type as string | undefined) ?? "buyer",
    course: undefined,
    bio: undefined,
    headline: undefined,
    specialties: [],
    avatarUrl: undefined,
    contactEmail: user.email ?? undefined,
    contactPhone: undefined,
    instagramHandle: undefined,
    verifiedStudent: isVerifiedStudentEmail(user.email),
    reliabilityScore: 5,
    productRating: 5,
    serviceRating: 5,
    transportRating: 5,
    housingRating: 0,
    housingReviewCount: 0,
    supportBalance: 0,
    supportCount: 0,
    reviewCount: 0,
  };
}

async function ensureCurrentProfileRow(user: User) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return buildCurrentProfileFallback(user);
  }

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select(profileSelect)
    .eq("id", user.id)
    .maybeSingle();

  if (existingProfile) {
    return normalizeProfile(existingProfile as ProfileRow);
  }

  const fallbackProfile = buildCurrentProfileFallback(user);
  const { data: insertedProfile } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      full_name: fallbackProfile.fullName,
      university: fallbackProfile.university,
      campus: fallbackProfile.campus,
      account_type: fallbackProfile.accountType,
      contact_email: fallbackProfile.contactEmail ?? null,
      verified_student: fallbackProfile.verifiedStudent,
    })
    .select(profileSelect)
    .single();

  return insertedProfile
    ? normalizeProfile(insertedProfile as ProfileRow)
    : fallbackProfile;
}

function createSupabasePublicClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  return createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function getPublicProfileById(id: string): Promise<{
  profile: PublicProfile | null;
  source: "empty" | "supabase";
}> {
  if (!isSupabaseConfigured()) {
    return {
      profile: null,
      source: "empty",
    };
  }

  try {
    const supabase = createSupabasePublicClient();

    if (!supabase) {
      return {
        profile: null,
        source: "empty",
      };
    }

    const { data, error } = await supabase
      .from("profiles")
      .select(profileSelect)
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      return {
        profile: null,
        source: "supabase",
      };
    }

    return {
      profile: normalizeProfile(data as ProfileRow),
      source: "supabase",
    };
  } catch {
    return {
      profile: null,
      source: "supabase",
    };
  }
}

export async function getProfileListings(profileId: string, options?: {
  limit?: number;
}): Promise<Listing[]> {
  const limit = options?.limit ?? 12;

  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const supabase = createSupabasePublicClient();

    if (!supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from("listings")
      .select(listingSelect)
      .eq("status", "active")
      .eq("owner_id", profileId)
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data?.length) {
      return [];
    }

    return data.map((row) => normalizeListing(row as ListingRow));
  } catch {
    return [];
  }
}

export async function getCurrentProfile() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      userId: null,
      profile: null as PublicProfile | null,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      userId: null,
      profile: null as PublicProfile | null,
    };
  }

  return {
    userId: user.id,
    profile: await ensureCurrentProfileRow(user),
  };
}

export function getFallbackProfileIdFromName(name: string) {
  return slugifyProfileId(name);
}
