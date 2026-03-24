import Link from "next/link";
import { ShieldCheck, Store } from "lucide-react";

import styles from "@/components/profile/profile-shell.module.scss";
import { MarketplaceListingCard } from "@/components/marketplace/marketplace-listing-card";
import { getListingMoneyHeadline } from "@/lib/listing-detail";
import type { Listing } from "@/lib/listings";
import { getListingLocationPrimary } from "@/lib/location";
import type { PublicProfile } from "@/lib/profiles";

type Props = {
  profile: PublicProfile;
  listings: Listing[];
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

function getProfileRatingLabel(value: number, hasReviews: boolean) {
  return hasReviews ? value.toFixed(1) : "Sem avaliacoes";
}

export function PublicProfileView({ profile, listings }: Props) {
  const catalogSectionId = "catalogo-vendedor";
  const activeLocations = Array.from(
    new Set(listings.map((listing) => getListingLocationPrimary(listing))),
  ).slice(0, 4);

  return (
    <section className={styles.shell}>
      <section className={styles.hero}>
        <div className={styles.heroMain}>
          <div className={styles.avatar}>{getInitials(profile.fullName)}</div>

          <div className={styles.heroCopy}>
            <span className="eyebrow">Perfil</span>
            <h1>{profile.fullName}</h1>
            <p>{profile.headline ?? "Ativo no CAMPUS."}</p>

            <div className={styles.metaRow}>
              <span className={`${styles.metaPill} ${styles.metaPillStrong}`}>
                <ShieldCheck size={14} />
                {profile.verifiedStudent ? "Estudante verificado" : "Conta ativa"}
              </span>
              <span className={styles.metaPill}>{profile.university}</span>
              <span className={styles.metaPill}>{profile.campus}</span>
              {profile.course ? <span className={styles.metaPill}>{profile.course}</span> : null}
            </div>
          </div>
        </div>

        <div className={styles.actionRow}>
          <Link className={styles.actionLink} href={`#${catalogSectionId}`}>
            <Store size={16} />
            Ver catalogo
          </Link>
          <Link className={styles.secondaryLink} href="/feed">
            <Store size={16} />
            Voltar ao feed
          </Link>
        </div>
      </section>

      <section className={styles.statsGrid}>
        <article className={styles.statCard}>
          <span>Confianca</span>
          <strong>{getProfileRatingLabel(profile.reliabilityScore, profile.reviewCount > 0)}</strong>
        </article>
        <article className={styles.statCard}>
          <span>Produtos</span>
          <strong>{getProfileRatingLabel(profile.productRating, profile.reviewCount > 0)}</strong>
        </article>
        <article className={styles.statCard}>
          <span>Servicos</span>
          <strong>{getProfileRatingLabel(profile.serviceRating, profile.reviewCount > 0)}</strong>
        </article>
        <article className={styles.statCard}>
          <span>Transporte</span>
          <strong>{getProfileRatingLabel(profile.transportRating, profile.reviewCount > 0)}</strong>
        </article>
        <article className={styles.statCard}>
          <span>Moradia</span>
          <strong>
            {getProfileRatingLabel(profile.housingRating, profile.housingReviewCount > 0)}
          </strong>
        </article>
        {profile.supportCount ? (
          <article className={styles.statCard}>
            <span>Apoio</span>
            <strong>{moneyFormatter.format(profile.supportBalance)}</strong>
          </article>
        ) : null}
        <article className={styles.statCard}>
          <span>Avaliacoes</span>
          <strong>{profile.reviewCount}</strong>
        </article>
      </section>

      <section className={styles.infoGrid}>
        <article className={styles.card}>
          <div className={styles.sectionTitle}>
            <strong>Sobre</strong>
          </div>
          <div className={styles.copyBlock}>
            <p>{profile.bio ?? "Sem bio ainda."}</p>
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
            {activeLocations.length ? (
              activeLocations.map((location) => (
                <span key={location} className={styles.locationPill}>
                  {location}
                </span>
              ))
            ) : (
              <span className={styles.locationPill}>{profile.campus}</span>
            )}
          </div>
        </article>
      </section>

      {listings.length ? (
        <section className={styles.listingGrid} id={catalogSectionId}>
          <div className={styles.sectionTitle}>
            <strong>Catalogo</strong>
            <span>{listings.length} anuncio(s) ativos.</span>
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
      ) : (
        <div className={styles.emptyCard}>
          <strong>Catalogo sem anuncios ativos.</strong>
          <p>Quando esse perfil publicar algo real, entra aqui.</p>
        </div>
      )}
    </section>
  );
}
