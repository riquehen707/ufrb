import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  MapPin,
  Package,
  Star,
} from "lucide-react";

import { MarketplaceListingCard } from "@/components/marketplace/marketplace-listing-card";
import { PageShell } from "@/components/shell/page-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import {
  getListingLocationLine,
  getListingProfileId,
} from "@/lib/location";
import {
  getListingDetailConfig,
  getListingMetaChips,
  getListingMoneyHeadline,
} from "@/lib/listing-detail";
import { getListingById, getMarketplaceDataWithOptions } from "@/lib/marketplace";
import {
  listingIntentLabels,
  listingTypeLabels,
} from "@/lib/listing-taxonomy";

type ListingDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ListingDetailPage({
  params,
}: ListingDetailPageProps) {
  const { id } = await params;
  const [{ listing }, marketplace] = await Promise.all([
    getListingById(id),
    getMarketplaceDataWithOptions({ limit: 18 }),
  ]);

  if (!listing) {
    notFound();
  }

  const detailConfig = getListingDetailConfig(listing);
  const metaChips = getListingMetaChips(listing);
  const priceHeadline = getListingMoneyHeadline(listing);
  const locationLine = getListingLocationLine(listing);
  const sellerProfileId = getListingProfileId(listing);
  const galleryImages = Array.from(
    new Set([listing.imageUrl, ...(listing.galleryUrls ?? [])].filter(Boolean)),
  ) as string[];
  const relatedListings = marketplace.listings
    .filter((candidate) => candidate.id !== listing.id)
    .filter(
      (candidate) =>
        candidate.category === listing.category || candidate.type === listing.type,
    )
    .slice(0, 3);
  const MediaIcon = listing.type === "service" ? BriefcaseBusiness : Package;

  return (
    <PageShell mainClassName="section">
      <div className="container page-stack">
        <Link href="/feed" className="listing-detail-back">
          <ArrowLeft size={16} />
          Voltar ao feed
        </Link>

        <section className="page-hero listing-detail-hero">
          <div className="listing-detail-hero-grid">
            <div className="listing-detail-media">
              {listing.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={listing.imageUrl} alt="" />
              ) : (
                <div className="listing-detail-media-placeholder">
                  <span className="catalog-card-placeholder-kicker">
                    {listing.category}
                  </span>
                  <MediaIcon size={30} />
                  <strong>{listing.focus ?? listing.category}</strong>
                  <span>
                    {listing.type === "product"
                      ? "Foto principal do item."
                      : "Capa ou imagem do servico."}
                  </span>
                </div>
              )}

              <div className="listing-detail-media-scrim" />
            </div>

            <div className="listing-detail-copy">
              <div className="listing-detail-badge-row">
                <span className="eyebrow">{detailConfig.eyebrow}</span>
                <span className="status-pill" data-tone={listing.intent === "request" ? "info" : "success"}>
                  {listingIntentLabels[listing.intent]}
                </span>
                <span className="listing-kind">{listingTypeLabels[listing.type]}</span>
              </div>

              <h1>{listing.title}</h1>
              <p className="listing-detail-lead">{detailConfig.lead}</p>

              <div className="listing-detail-meta">
                <span className="listing-detail-meta-item">
                  <MapPin size={15} />
                  {locationLine}
                </span>
                <span className="listing-detail-meta-item">{listing.deliveryMode}</span>
                <span className="listing-detail-meta-item">
                  <Star size={15} />
                  {listing.rating.toFixed(1)}
                </span>
              </div>

              <div className="tag-row listing-detail-tag-row">
                {metaChips.map((chip) => (
                  <span key={chip} className="tag">
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            <aside className="tips-card listing-detail-side">
              <div className="listing-detail-price">
                <span>{listing.intent === "request" ? "Faixa declarada" : "Preco base"}</span>
                <strong>{priceHeadline}</strong>
              </div>

              <div className="listing-detail-seller">
                <strong>{listing.sellerName}</strong>
                <span>{listing.sellerCourse}</span>
                <Link
                  className="listing-detail-seller-link"
                  href={`/perfil/${sellerProfileId}`}
                >
                  Ver perfil publico
                </Link>
              </div>

              <div className="listing-detail-action-stack">
                <Link className="primary-button" href={detailConfig.primaryAction.href}>
                  {detailConfig.primaryAction.label}
                </Link>
                <Link className="secondary-button" href={detailConfig.secondaryAction.href}>
                  {detailConfig.secondaryAction.label}
                </Link>
              </div>
            </aside>
          </div>
        </section>

        {galleryImages.length > 1 ? (
          <section className="listing-detail-gallery-grid">
            {galleryImages.slice(1).map((imageUrl) => (
              <div key={imageUrl} className="listing-detail-gallery-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="" loading="lazy" />
              </div>
            ))}
          </section>
        ) : null}

        <section className="quick-grid">
          {detailConfig.summary.map((item) => (
            <article key={item.label} className="quick-card listing-detail-summary-card">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <p>{item.hint}</p>
            </article>
          ))}
        </section>

        <section className="create-grid">
          <article className="tips-card">
            <strong>Descricao</strong>
            <p>{listing.description}</p>

            {listing.locationNote ? (
              <div className="status-banner" data-tone="success">
                <strong>Local:</strong> {locationLine}
              </div>
            ) : null}

            <div className="tag-row">
              {listing.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          </article>

          <article className="tips-card">
            <strong>{detailConfig.experienceTitle}</strong>
            <ul className="helper-list">
              {detailConfig.experienceItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </section>

        <section className="create-grid">
          <article className="tips-card">
            <strong>{detailConfig.negotiationTitle}</strong>
            <ul className="helper-list">
              {detailConfig.negotiationItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </section>

        {relatedListings.length ? (
          <section className="listing-detail-related">
            <SectionHeading
              eyebrow="Relacionados"
              title="Relacionados"
            />

            <div className="catalog-results-grid">
              {relatedListings.map((relatedListing) => (
                <MarketplaceListingCard
                  key={relatedListing.id}
                  listing={relatedListing}
                  priceHeadline={getListingMoneyHeadline(relatedListing)}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </PageShell>
  );
}
