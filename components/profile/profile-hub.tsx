import Link from "next/link";
import {
  Compass,
  Coins,
  PenSquare,
  ShieldCheck,
  Store,
  UserRound,
} from "lucide-react";

import { AuthPanel } from "@/components/auth/auth-panel";
import { ProfileActivityPanel } from "@/components/profile/profile-activity-panel";
import { ProfileListingActions } from "@/components/profile/profile-listing-actions";
import { SignOutButton } from "@/components/auth/sign-out-button";
import styles from "@/components/profile/profile-shell.module.scss";
import { MarketplaceListingCard } from "@/components/marketplace/marketplace-listing-card";
import { getListingMoneyHeadline } from "@/lib/listing-detail";
import { summarizeListingPerformance } from "@/lib/marketplace-manager";
import {
  getLowBalanceThreshold,
  getNextMonthlyGrantDate,
} from "@/lib/monetization/plans";
import type { ProfileActivitySnapshot } from "@/lib/profile-activity";
import type { Listing } from "@/lib/listings";
import { getListingLocationPrimary } from "@/lib/location";
import type { PublicProfile } from "@/lib/profiles";

type Props = {
  profile: PublicProfile | null;
  listings: Listing[];
  activity: ProfileActivitySnapshot;
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

function getProfileRatingLabel(value: number, hasReviews: boolean) {
  return hasReviews ? value.toFixed(1) : "Sem avaliacoes";
}

function formatShortDate(value?: string | Date | null) {
  if (!value) {
    return "no proximo ciclo";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

export function ProfileHub({
  profile,
  listings,
  activity,
  savedNotice = false,
}: Props) {
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
  const listingSnapshot = summarizeListingPerformance(listings);
  const lowBalanceThreshold = getLowBalanceThreshold(profile.planType);
  const isLowBalance = profile.tokenBalance <= lowBalanceThreshold;
  const nextMonthlyGrantDate =
    profile.planType === "free"
      ? getNextMonthlyGrantDate(profile.monthlyTokenLastGrantedAt)
      : null;
  const nextMonthlyGrantLabel = formatShortDate(nextMonthlyGrantDate);

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
              {profile.planType === "pro" ? (
                <span className={styles.metaPill}>Selo Pro</span>
              ) : null}
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
          <Link className={styles.secondaryLink} href="/tokens">
            <Coins size={16} />
            Planos e tokens
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
          <strong>{getProfileRatingLabel(profile.reliabilityScore, profile.reviewCount > 0)}</strong>
        </article>
        <article className={styles.statCard}>
          <span>Tokens</span>
          <strong>{profile.tokenBalance}</strong>
        </article>
        <article className={styles.statCard}>
          <span>Moradia</span>
          <strong>
            {getProfileRatingLabel(profile.housingRating, profile.housingReviewCount > 0)}
          </strong>
        </article>
        <article className={styles.statCard}>
          <span>Tokens ganhos</span>
          <strong>{profile.tokenEarned}</strong>
        </article>
      </section>

      <section className={styles.listingGrid}>
        <div className={styles.sectionTitle}>
          <strong>Saldo e plano</strong>
          <span>
            {profile.planType === "pro"
              ? "Plano Pro ativo por 30 dias a cada Pix confirmado."
              : `Plano Free libera 3 tokens por mes. Proxima recarga ${nextMonthlyGrantLabel}.`}
          </span>
        </div>
        <div className={styles.previewGrid}>
          <article className={styles.statCard}>
            <span>Voce tem</span>
            <strong>{profile.tokenBalance} tokens</strong>
            <p className={styles.helperText}>
              {isLowBalance
                ? "Saldo baixo para publicar com folga."
                : "Simples custa 1 token. Premium custa 2."}
            </p>
          </article>
          <article className={styles.statCard}>
            <span>Plano atual</span>
            <strong>{profile.planType === "pro" ? "Pro" : "Free"}</strong>
            <p className={styles.helperText}>
              {profile.planType === "pro"
                ? "Selo ativo e prioridade moderada nos anuncios."
                : "Tu pode comprar pacotes quando precisar."}
            </p>
          </article>
          <article className={styles.statCard}>
            <span>{profile.planType === "pro" ? "Credito do ciclo" : "Credito mensal"}</span>
            <strong>{profile.planType === "pro" ? "40 tokens" : "3 tokens"}</strong>
            <p className={styles.helperText}>
              {profile.planType === "pro"
                ? "Liberado quando o Pix do Pro confirmar."
                : `Proxima recarga ${nextMonthlyGrantLabel}.`}
            </p>
          </article>
          <article className={styles.statCard}>
            <span>Recarga</span>
            <strong>{isLowBalance ? "Saldo insuficiente" : "Planos e tokens"}</strong>
            <p className={styles.helperText}>
              {isLowBalance
                ? "Compre mais tokens ou assine o plano Pro."
                : "Abre o historico, os pacotes e o plano Pro."}
            </p>
            <Link className={styles.secondaryLink} href="/tokens">
              <Coins size={16} />
              Abrir agora
            </Link>
          </article>
        </div>
      </section>

      <section className={styles.listingGrid}>
        <div className={styles.sectionTitle}>
          <strong>Painel rapido</strong>
          <span>Leitura direta do que esta no ar e do potencial atual.</span>
        </div>

        <div className={styles.previewGrid}>
          <article className={styles.statCard}>
            <span>Potencial ativo</span>
            <strong>{moneyFormatter.format(listingSnapshot.potentialGross)}</strong>
          </article>
          <article className={styles.statCard}>
            <span>Produtos no ar</span>
            <strong>{moneyFormatter.format(listingSnapshot.productPotential)}</strong>
          </article>
          <article className={styles.statCard}>
            <span>Servicos no ar</span>
            <strong>{moneyFormatter.format(listingSnapshot.servicePotential)}</strong>
          </article>
          <article className={styles.statCard}>
            <span>Demandas abertas</span>
            <strong>{listingSnapshot.activeRequests}</strong>
          </article>
          <article className={styles.statCard}>
            <span>Ticket medio</span>
            <strong>{moneyFormatter.format(listingSnapshot.averageOfferTicket)}</strong>
          </article>
          <article className={styles.statCard}>
            <span>Categorias</span>
            <strong>{listingSnapshot.activeCategories}</strong>
          </article>
        </div>
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
            {(activeLocations.length ? activeLocations : [profile.campus]).map((location) => (
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

      <ProfileActivityPanel activity={activity} />

      <ProfileListingActions
        listings={listings}
        tokenBalance={profile.tokenBalance}
        planType={profile.planType}
      />

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
