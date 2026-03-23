import type { Metadata } from "next";

import { ProfileHub } from "@/components/profile/profile-hub";
import { getCurrentProfileActivity } from "@/lib/profile-activity";
import { PageShell } from "@/components/shell/page-shell";
import { getProfileListings, getCurrentProfile } from "@/lib/profiles";

type ProfilePageProps = {
  searchParams: Promise<{
    salvo?: string | string[] | undefined;
  }>;
};

export const metadata: Metadata = {
  title: "Perfil",
  description: "Conta, reputacao e atividade no CAMPUS.",
};

function readSingleValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const params = await searchParams;
  const { profile } = await getCurrentProfile();
  const [listings, activity] = profile
    ? await Promise.all([
        getProfileListings(profile.id, { limit: 12 }),
        getCurrentProfileActivity(profile.id),
      ])
    : [
        [],
        {
          recentPurchases: [],
          recentSales: [],
          pendingReviews: [],
          receivedReviews: [],
        },
      ];
  const savedNotice = readSingleValue(params.salvo) === "1";

  return (
    <PageShell mainClassName="section">
      <div className="container page-stack">
        <ProfileHub
          profile={profile}
          listings={listings}
          activity={activity}
          savedNotice={savedNotice}
        />
      </div>
    </PageShell>
  );
}
