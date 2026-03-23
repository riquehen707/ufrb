import { createClient } from "@supabase/supabase-js";

import type { ListingType } from "@/lib/listing-taxonomy";
import {
  isSupabaseConfigured,
  supabaseAnonKey,
  supabaseUrl,
} from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CommerceOrderItem = {
  id: string;
  listingId: string | null;
  title: string;
  category: string;
  orderType: ListingType;
  amount: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  counterpartName: string;
  createdAt: string;
  completedAt: string | null;
};

export type ReviewTask = {
  orderId: string;
  listingId: string | null;
  title: string;
  category: string;
  reviewType: ListingType;
  counterpartName: string;
  amount: number;
  completedAt: string | null;
};

export type ReceivedReview = {
  id: string;
  orderId: string | null;
  title: string;
  reviewType: ListingType;
  reviewerName: string;
  rating: number;
  comment?: string;
  createdAt: string;
};

export type ProfileActivitySnapshot = {
  recentPurchases: CommerceOrderItem[];
  recentSales: CommerceOrderItem[];
  pendingReviews: ReviewTask[];
  receivedReviews: ReceivedReview[];
};

type OrderRow = {
  id: string;
  listing_id: string | null;
  buyer_profile_id: string | null;
  seller_profile_id: string | null;
  order_type: ListingType;
  amount: number | string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  created_at: string;
  completed_at: string | null;
  reviewed_by_buyer_at: string | null;
  reviewed_by_seller_at: string | null;
};

type ListingMetaRow = {
  id: string;
  title: string;
  category: string;
};

type ProfileMetaRow = {
  id: string;
  full_name: string | null;
};

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

export async function getCurrentProfileActivity(
  profileId: string | null,
): Promise<ProfileActivitySnapshot> {
  if (!profileId || !isSupabaseConfigured()) {
    return {
      recentPurchases: [],
      recentSales: [],
      pendingReviews: [],
      receivedReviews: [],
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      recentPurchases: [],
      recentSales: [],
      pendingReviews: [],
      receivedReviews: [],
    };
  }

  const { data: orderRows, error: ordersError } = await supabase
    .from("marketplace_orders")
    .select(
      "id, listing_id, buyer_profile_id, seller_profile_id, order_type, amount, status, created_at, completed_at, reviewed_by_buyer_at, reviewed_by_seller_at",
    )
    .or(`buyer_profile_id.eq.${profileId},seller_profile_id.eq.${profileId}`)
    .order("created_at", { ascending: false })
    .limit(24);

  if (ordersError || !orderRows) {
    return {
      recentPurchases: [],
      recentSales: [],
      pendingReviews: [],
      receivedReviews: [],
    };
  }

  const { data: reviewRows } = await supabase
    .from("marketplace_reviews")
    .select(
      "id, order_id, reviewer_id, reviewed_profile_id, review_type, rating, comment, created_at",
    )
    .eq("reviewed_profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(8);

  const listingIds = Array.from(
    new Set(
      orderRows
        .map((row) => row.listing_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const counterpartIds = Array.from(
    new Set(
      orderRows
        .flatMap((row) => [row.buyer_profile_id, row.seller_profile_id])
        .filter(
          (value): value is string => Boolean(value) && value !== profileId,
        ),
    ),
  );
  const reviewerIds = Array.from(
    new Set(
      (reviewRows ?? [])
        .map((row) => row.reviewer_id)
        .filter((value) => value !== profileId),
    ),
  );

  const publicClient = createSupabasePublicClient();
  const [listingMetaRows, counterpartRows, reviewerRows] = publicClient
    ? await Promise.all([
        listingIds.length
          ? publicClient
              .from("listings")
              .select("id, title, category")
              .in("id", listingIds)
              .then(({ data }) => (data ?? []) as ListingMetaRow[])
          : Promise.resolve([] as ListingMetaRow[]),
        counterpartIds.length
          ? publicClient
              .from("profiles")
              .select("id, full_name")
              .in("id", counterpartIds)
              .then(({ data }) => (data ?? []) as ProfileMetaRow[])
          : Promise.resolve([] as ProfileMetaRow[]),
        reviewerIds.length
          ? publicClient
              .from("profiles")
              .select("id, full_name")
              .in("id", reviewerIds)
              .then(({ data }) => (data ?? []) as ProfileMetaRow[])
          : Promise.resolve([] as ProfileMetaRow[]),
      ])
    : [[], [], []];

  const listingMap = new Map(listingMetaRows.map((row) => [row.id, row]));
  const profileMap = new Map(
    [...counterpartRows, ...reviewerRows].map((row) => [row.id, row]),
  );

  const normalizedOrders = (orderRows as OrderRow[]).map((row) => {
    const listing = row.listing_id ? listingMap.get(row.listing_id) : null;
    const counterpartId =
      row.buyer_profile_id === profileId
        ? row.seller_profile_id
        : row.buyer_profile_id;
    const counterpart = counterpartId ? profileMap.get(counterpartId) : null;

    return {
      id: row.id,
      listingId: row.listing_id,
      title: listing?.title ?? "Pedido do CAMPUS",
      category: listing?.category ?? "Marketplace",
      orderType: row.order_type,
      amount: Number(row.amount),
      status: row.status,
      counterpartName: counterpart?.full_name ?? "Conta CAMPUS",
      createdAt: row.created_at,
      completedAt: row.completed_at,
      reviewedByBuyerAt: row.reviewed_by_buyer_at,
      reviewedBySellerAt: row.reviewed_by_seller_at,
      buyerProfileId: row.buyer_profile_id,
      sellerProfileId: row.seller_profile_id,
    };
  });

  const recentPurchases = normalizedOrders
    .filter((order) => order.buyerProfileId === profileId)
    .slice(0, 5)
    .map((order) => ({
      id: order.id,
      listingId: order.listingId,
      title: order.title,
      category: order.category,
      orderType: order.orderType,
      amount: order.amount,
      status: order.status,
      counterpartName: order.counterpartName,
      createdAt: order.createdAt,
      completedAt: order.completedAt,
    }));

  const recentSales = normalizedOrders
    .filter((order) => order.sellerProfileId === profileId)
    .slice(0, 5)
    .map((order) => ({
      id: order.id,
      listingId: order.listingId,
      title: order.title,
      category: order.category,
      orderType: order.orderType,
      amount: order.amount,
      status: order.status,
      counterpartName: order.counterpartName,
      createdAt: order.createdAt,
      completedAt: order.completedAt,
    }));

  const pendingReviews = normalizedOrders
    .filter((order) => order.status === "completed")
    .filter((order) =>
      order.buyerProfileId === profileId
        ? !order.reviewedByBuyerAt
        : !order.reviewedBySellerAt,
    )
    .slice(0, 4)
    .map((order) => ({
      orderId: order.id,
      listingId: order.listingId,
      title: order.title,
      category: order.category,
      reviewType: order.orderType,
      counterpartName: order.counterpartName,
      amount: order.amount,
      completedAt: order.completedAt,
    }));

  const receivedReviews = (reviewRows ?? []).map((row) => ({
    id: row.id,
    orderId: row.order_id,
    title:
      row.order_id && normalizedOrders.find((order) => order.id === row.order_id)?.title
        ? normalizedOrders.find((order) => order.id === row.order_id)!.title
        : "Avaliacao recebida",
    reviewType: row.review_type,
    reviewerName: profileMap.get(row.reviewer_id)?.full_name ?? "Conta CAMPUS",
    rating: Number(row.rating),
    comment: row.comment ?? undefined,
    createdAt: row.created_at,
  }));

  return {
    recentPurchases,
    recentSales,
    pendingReviews,
    receivedReviews,
  };
}
