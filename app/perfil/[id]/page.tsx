import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicProfileView } from "@/components/profile/public-profile-view";
import { PageShell } from "@/components/shell/page-shell";
import { getProfileListings, getPublicProfileById } from "@/lib/profiles";

type PublicProfilePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata({
  params,
}: PublicProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const { profile } = await getPublicProfileById(id);

  if (!profile) {
    return {
      title: "Perfil",
    };
  }

  return {
    title: profile.fullName,
    description:
      profile.headline ??
      `Perfil publico de ${profile.fullName} no CAMPUS.`,
  };
}

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { id } = await params;
  const { profile } = await getPublicProfileById(id);

  if (!profile) {
    notFound();
  }

  const listings = await getProfileListings(profile.id, { limit: 24 });

  return (
    <PageShell mainClassName="section">
      <div className="container page-stack">
        <PublicProfileView profile={profile} listings={listings} />
      </div>
    </PageShell>
  );
}
