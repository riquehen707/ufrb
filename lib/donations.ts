import { createSupabasePublicServerClient } from "@/lib/supabase/admin";

export type DonationWallEntry = {
  id: string;
  donorName: string;
  amount: number;
  confirmedAt: string;
  supporterProfileId?: string;
};

export type DonationOverview = {
  totalConfirmed: number;
  supporterCount: number;
  recentSupporters: DonationWallEntry[];
};

type DonationRow = {
  id: string;
  donor_name: string | null;
  amount: number | string | null;
  confirmed_at: string | null;
  supporter_profile_id: string | null;
};

export function createDonationReference(id: string) {
  return `APOIO-${id.slice(0, 8).toUpperCase()}`;
}

export async function getDonationOverview(limit = 8): Promise<DonationOverview> {
  const supabase = createSupabasePublicServerClient();

  if (!supabase) {
    return {
      totalConfirmed: 0,
      supporterCount: 0,
      recentSupporters: [],
    };
  }

  try {
    const [{ data: donations }, { data: aggregate }] = await Promise.all([
      supabase
        .from("donations")
        .select("id, donor_name, amount, confirmed_at, supporter_profile_id")
        .eq("status", "confirmed")
        .eq("is_public", true)
        .order("confirmed_at", { ascending: false })
        .limit(limit),
      supabase
        .from("donations")
        .select("amount, donor_name, supporter_profile_id")
        .eq("status", "confirmed")
        .eq("is_public", true),
    ]);

    const rows = (donations ?? []) as DonationRow[];
    const amounts = (aggregate ?? []) as Array<{
      amount: number | string | null;
      donor_name: string | null;
      supporter_profile_id: string | null;
    }>;
    const supporterKeys = new Set(
      amounts.map((row) => row.supporter_profile_id ?? row.donor_name ?? "").filter(Boolean),
    );

    return {
      totalConfirmed: amounts.reduce((total, row) => total + Number(row.amount ?? 0), 0),
      supporterCount: supporterKeys.size,
      recentSupporters: rows.map((row) => ({
        id: row.id,
        donorName: row.donor_name ?? "Apoiador",
        amount: Number(row.amount ?? 0),
        confirmedAt: row.confirmed_at ?? new Date(0).toISOString(),
        supporterProfileId: row.supporter_profile_id ?? undefined,
      })),
    };
  } catch {
    return {
      totalConfirmed: 0,
      supporterCount: 0,
      recentSupporters: [],
    };
  }
}
