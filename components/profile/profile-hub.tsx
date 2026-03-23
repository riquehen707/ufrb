import Link from "next/link";
import { Compass, PenSquare, ShieldCheck, Store, UserRound } from "lucide-react";

import { AuthPanel } from "@/components/auth/auth-panel";
import { SignOutButton } from "@/components/auth/sign-out-button";
import styles from "@/components/profile/profile-shell.module.scss";
import { MarketplaceListingCard } from "@/components/marketplace/marketplace-listing-card";
import { getListingMoneyHeadline } from "@/lib/listing-detail";
import { getListingLocationPrimary } from "@/lib/location";
import type { Listing } from "@/lib/mock-data";
import type { PublicProfile } from "@/lib/profiles";

type Props = {
  profile: PublicProfile | null;
  listings: Listing[];
  savedNotice?: boolean;
};

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getInstagramHref(handle: string) {
  return `https://instagram.com/${handle.replace(/^@/, "")}`;
}

export function ProfileHub({ profile, listings, savedNotice = false }: Props) {
  if (!profile) {
    return (
      <section className={styles.shell}>
        <AuthPanel
          title="Criar teu perfil"
          description="Entra para publicar, editar e concentrar tua reputacao."
          initialMode="sign-up"
          redirectTo="/perfil/editar"
        />
      </section>
    );
  }

  const activeLocations = Array.from(
    new Set(listings.map((listing) => getListingLocationPrimary(listing))),
  ).slice(0, 4);

  return (
    <section className={styles.shell}>
      {savedNotice ? (
        <div className="status-banner" data-tone="success">
          Perfil salvo.
        </div>
      ) : null}

      <section className={styles.hero}>
        <div className={styles.heroMain}>
          <div className={styles.avatar}>{getInitials(profile.fullName)}</div>

          <div className={styles.heroCopy}>
            <span className="eyebrow">Minha conta</span>
            <h1>{profile.fullName}</h1>
            <p>{profile.headline ?? "Organiza teu perfil no CAMPUS."}</p>

            <div className={styles.metaRow}>
              <span className={`${styles.metaPill} ${styles.metaPillStrong}`}>
                <ShieldCheck size={14} />
                {profile.verifiedStudent ? "Estudante verificado" : "Conta ativa"}
              </span>
              <span className={styles.metaPill}>{profile.campus}</span>
              {profile.course ? <span className={styles.metaPill}>{profile.course}</span> : null}
            </div>
          </div>
        </div>

        <div className={styles.actionRow}>
          <Link className={styles.actionLink} href="/perfil/editar">
            <PenSquare size={16} />
            Editar perfil
          </Link>
          <Link className={styles.secondaryLink} href={`/perfil/${profile.id}`}>
            <UserRound size={16} />
            Ver perfil publico
          </Link>
          <Link className={styles.secondaryLink} href="/feed?mode=seller">
            <Store size={16} />
            Ver modo vender
          </Link>
          <SignOutButton className={styles.secondaryLink} />
        </div>
      </section>

      <section className={styles.previewGrid}>
        <article className={styles.statCard}>
          <span>Confianca</span>
          <strong>{profile.reliabilityScore.toFixed(1)}</strong>
        </article>
        <article className={styles.statCard}>
          <span>Apoio dado</span>
          <strong>{moneyFormatter.format(profile.supportBalance)}</strong>
        </article>
        <article className={styles.statCard}>
          <span>Moradia</span>
          <strong>
            {profile.housingReviewCount ? profile.housingRating.toFixed(1) : "Novo"}
          </strong>
        </article>
        <article className={styles.statCard}>
          <span>Anuncios ativos</span>
          <strong>{listings.length}</strong>
        </article>
      </section>

      <section className={styles.infoGrid}>
        <article className={styles.card}>
          <div className={styles.sectionTitle}>
            <strong>Resumo</strong>
          </div>
          <div className={styles.copyBlock}>
            <p>{profile.bio ?? "Adiciona tua area e o que tu costuma fazer por aqui."}</p>
          </div>
          {profile.contactEmail || profile.contactPhone || profile.instagramHandle ? (
            <div className={styles.tagRow}>
              {profile.contactEmail ? (
                <a className={styles.tag} href={`mailto:${profile.contactEmail}`}>
                  {profile.contactEmail}
                </a>
              ) : null}
              {profile.contactPhone ? (
                <a className={styles.tag} href={`tel:${profile.contactPhone}`}>
                  {profile.contactPhone}
                </a>
              ) : null}
              {profile.instagramHandle ? (
                <a
                  className={styles.tag}
                  href={getInstagramHref(profile.instagramHandle)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {profile.instagramHandle}
                </a>
              ) : null}
            </div>
          ) : null}
          {profile.specialties.length ? (
            <div className={styles.tagRow}>
              {profile.specialties.map((specialty) => (
                <span key={specialty} className={styles.tag}>
                  {specialty}
                </span>
              ))}
            </div>
          ) : null}
        </article>

        <article className={styles.card}>
          <div className={styles.sectionTitle}>
            <strong>Locais</strong>
          </div>
          <div className={styles.locationList}>
            {activeLocations.map((location) => (
              <span key={location} className={styles.locationPill}>
                {location}
              </span>
            ))}
          </div>
          <Link className={styles.secondaryLink} href="/feed?mode=seller">
            <Compass size={16} />
            Meus anuncios
          </Link>
        </article>
      </section>

      {listings.length ? (
        <section className={styles.listingGrid}>
          <div className={styles.sectionTitle}>
            <strong>Anuncios</strong>
          </div>
          <div className="catalog-results-grid">
            {listings.map((listing) => (
              <MarketplaceListingCard
                key={listing.id}
                listing={listing}
                priceHeadline={getListingMoneyHeadline(listing)}
              />
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
