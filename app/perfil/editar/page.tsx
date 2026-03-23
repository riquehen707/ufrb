import type { Metadata } from "next";

import { ProfileEditForm } from "@/components/profile/profile-edit-form";
import { PageShell } from "@/components/shell/page-shell";
import { getCurrentProfile } from "@/lib/profiles";

export const metadata: Metadata = {
  title: "Editar perfil",
  description: "Ajuste teus dados e como teu perfil aparece no CAMPUS.",
};

export default async function EditProfilePage() {
  const { userId, profile } = await getCurrentProfile();

  return (
    <PageShell mainClassName="section">
      <div className="container page-stack">
        <ProfileEditForm userId={userId} profile={profile} />
      </div>
    </PageShell>
  );
}
