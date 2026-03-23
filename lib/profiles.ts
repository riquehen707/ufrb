import { createClient, type User } from "@supabase/supabase-js";

import { normalizeHousingDetails } from "@/lib/housing";
import { getListingProfileId, slugifyProfileId } from "@/lib/location";
import { mockListings, type Listing } from "@/lib/mock-data";
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

const mockProfileOverrides: Record<string, Partial<PublicProfile>> = {
  "ana-beatriz": {
    headline: "Monitoria de exatas, revisao para prova e grupos pequenos.",
    bio: "Universitaria que alterna entre ser monitora e aluna. Costuma atender no campus e em grupos de revisao.",
    specialties: ["Calculo", "Algebra linear", "Grupo de estudos"],
    verifiedStudent: true,
  },
  "rafael-nunes": {
    headline: "Fisica e quimica para ensino medio e licenciatura.",
    bio: "Atende reforco para ensino medio e materias de base, com foco em prova e vestibular.",
    specialties: ["Fisica", "Quimica", "Ensino medio"],
    verifiedStudent: true,
  },
  "pedro-henrique": {
    headline: "Rotas recorrentes entre campus, rodoviaria e bairros proximos.",
    bio: "Organiza grupos por horario e fecha rateio com antecedencia para dar mais previsibilidade ao trajeto.",
    specialties: ["Transporte comunitario", "Rotas fixas", "Rateio"],
    verifiedStudent: true,
  },
  "lucas-santana": {
    headline: "Montagem, pequenos ajustes e demandas rapidas de moradia.",
    bio: "Faz pequenos corres em republica e apartamento estudantil, com foco em montagem e reparo leve.",
    specialties: ["Montagem", "Pequenos reparos", "Moradia"],
    verifiedStudent: true,
  },
};

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

function buildMockProfile(id: string, listings: Listing[]): PublicProfile | null {
  if (!listings.length) {
    return null;
  }

  const firstListing = listings[0];
  const averageRating =
    listings.reduce((total, listing) => total + listing.rating, 0) / listings.length;
  const productListings = listings.filter((listing) => listing.type === "product");
  const serviceListings = listings.filter((listing) => listing.type === "service");
  const transportListings = listings.filter((listing) =>
    listing.category.includes("Transporte"),
  );
  const housingListings = listings.filter((listing) => listing.housingDetails);
  const override = mockProfileOverrides[id];
  const defaultSpecialties = Array.from(
    new Set(
      listings.flatMap((listing) =>
        [listing.category, listing.focus].filter(Boolean) as string[],
      ),
    ),
  ).slice(0, 4);

  return {
    id,
    fullName: firstListing.sellerName,
    university: "UFRB",
    campus: firstListing.campus,
    accountType:
      serviceListings.length > productListings.length ? "service-provider" : "seller",
    course: firstListing.sellerCourse,
    bio:
      override?.bio ??
      `${firstListing.sellerName} participa do CAMPUS com anuncios em ${firstListing.campus} e atua em mais de uma frente do marketplace.`,
    headline: override?.headline ?? firstListing.description,
    specialties: override?.specialties ?? defaultSpecialties,
    avatarUrl: override?.avatarUrl,
    contactEmail: undefined,
    contactPhone: undefined,
    instagramHandle: undefined,
    verifiedStudent: override?.verifiedStudent ?? true,
    reliabilityScore: override?.reliabilityScore ?? Number(averageRating.toFixed(1)),
    productRating:
      override?.productRating ??
      Number(
        (productListings.length
          ? productListings.reduce((total, listing) => total + listing.rating, 0) /
            productListings.length
          : averageRating
        ).toFixed(1),
      ),
    serviceRating:
      override?.serviceRating ??
      Number(
        (serviceListings.length
          ? serviceListings.reduce((total, listing) => total + listing.rating, 0) /
            serviceListings.length
          : averageRating
        ).toFixed(1),
      ),
    transportRating:
      override?.transportRating ??
      Number(
        (transportListings.length
          ? transportListings.reduce((total, listing) => total + listing.rating, 0) /
            transportListings.length
          : averageRating
        ).toFixed(1),
      ),
    housingRating:
      override?.housingRating ??
      Number(
        (housingListings.length
          ? housingListings.reduce((total, listing) => total + listing.rating, 0) /
            housingListings.length
          : 0
        ).toFixed(1),
      ),
    housingReviewCount: override?.housingReviewCount ?? housingListings.length * 2,
    supportBalance: override?.supportBalance ?? 0,
    supportCount: override?.supportCount ?? 0,
    reviewCount: override?.reviewCount ?? listings.length * 3,
  };
}

function getMockProfileListings(profileId: string) {
  return mockListings.filter((listing) => getListingProfileId(listing) === profileId);
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
  source: "mock" | "supabase";
}> {
  const fallbackProfile = buildMockProfile(id, getMockProfileListings(id));

  if (!isSupabaseConfigured()) {
    return {
      profile: fallbackProfile,
      source: "mock",
    };
  }

  try {
    const supabase = createSupabasePublicClient();

    if (!supabase) {
      return {
        profile: fallbackProfile,
        source: "mock",
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
  const fallbackListings = getMockProfileListings(profileId).slice(0, limit);

  if (!isSupabaseConfigured()) {
    return fallbackListings;
  }

  try {
    const supabase = createSupabasePublicClient();

    if (!supabase) {
      return fallbackListings;
    }

    const { data, error } = await supabase
      .from("listings")
      .select(
        "id, owner_id, intent, title, type, category, focus, item_condition, negotiation_mode, image_url, gallery_urls, location_note, housing_details, price, price_unit, campus, seller_name, seller_course, rating, delivery_mode, featured, description, tags",
      )
      .eq("status", "active")
      .eq("owner_id", profileId)
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data?.length) {
      return [];
    }

    return data.map((row) => ({
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
      description: row.description ?? "Anuncio carregado sem descricao detalhada.",
      tags: row.tags ?? [],
    }));
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
