import Link from "next/link";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  MapPin,
  Package,
  Sparkles,
  Star,
} from "lucide-react";

import {
  getListingLocationPrimary,
  getListingLocationSecondary,
} from "@/lib/location";
import styles from "@/components/marketplace/marketplace-listing-card.module.scss";
import {
  getHousingGenderLabel,
  getHousingPaymentLabel,
  housingListingKindLabels,
} from "@/lib/housing";
import type { Listing } from "@/lib/listings";
import {
  itemConditionLabels,
  listingIntentLabels,
  listingTypeLabels,
  negotiationModeLabels,
} from "@/lib/listing-taxonomy";

type Props = {
  listing: Listing;
  priceHeadline: string;
};

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

function getSellerInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function MarketplaceListingCard({ listing, priceHeadline }: Props) {
  const intentTone = listing.intent === "request" ? "info" : "success";
  const MediaIcon = listing.type === "service" ? BriefcaseBusiness : Package;
  const locationPrimary = getListingLocationPrimary(listing);
  const locationSecondary = getListingLocationSecondary(listing);
  const isHousing = Boolean(listing.housingDetails);
  const attributeItems = isHousing
    ? [
        {
          label: "Formato",
          value: housingListingKindLabels[listing.housingDetails!.listingKind],
        },
        {
          label: "Divisao",
          value: listing.housingDetails?.totalRent
            ? `Total ${moneyFormatter.format(listing.housingDetails.totalRent)}`
            : "Valor mensal",
        },
      ]
    : [
        {
          label: listing.type === "product" ? "Estado" : "Recorte",
          value:
            listing.type === "product"
              ? listing.itemCondition
                ? itemConditionLabels[listing.itemCondition]
                : "Sem estado"
              : listing.focus ?? "Sem recorte",
        },
        {
          label: "Negociacao",
          value: negotiationModeLabels[listing.negotiationMode],
        },
      ];

  return (
    <Link
      href={`/anuncios/${listing.id}`}
      aria-label={`Abrir anuncio: ${listing.title}`}
      className={`${styles.card} ${listing.featured ? styles.featured : ""}`}
      data-kind={listing.type}
      data-intent={listing.intent}
    >
      <div className={styles.media}>
        {listing.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className={styles.image}
            src={listing.imageUrl}
            alt=""
            loading="lazy"
          />
        ) : (
          <div className={styles.placeholder}>
            <span className={styles.placeholderKicker}>
              {listing.focus ?? listing.category}
            </span>
            <MediaIcon size={26} />
            <strong>{listing.title}</strong>
            <span>
              {listing.type === "product"
                ? "Foto principal do item"
                : "Foto, capa ou servico"}
            </span>
          </div>
        )}

        <div className={styles.mediaScrim} />

        <div className={styles.overlay}>
          <span className="status-pill" data-tone={intentTone}>
            {listingIntentLabels[listing.intent]}
          </span>
          <span className="listing-kind">{listingTypeLabels[listing.type]}</span>
          {listing.featured ? (
            <span className="status-pill" data-tone="warning">
              <Sparkles size={13} />
              Destaque
            </span>
          ) : null}
        </div>

        {listing.imageUrl ? (
          <div className={styles.mediaCopy}>
            <span className={styles.mediaKicker}>{listing.category}</span>
            <strong>{listing.focus ?? listing.category}</strong>
          </div>
        ) : null}
      </div>

      <div className={styles.body}>
        <div className={styles.priceRow}>
          <div className={styles.priceCopy}>
            <span>{listing.intent === "request" ? "Orcamento" : "Preco"}</span>
            <strong>{priceHeadline}</strong>
          </div>

          <span className={styles.ratingChip}>
            <Star size={14} />
            {listing.rating.toFixed(1)}
          </span>
        </div>

        <div className={styles.summary}>
          <h3>{listing.title}</h3>
          <p>{listing.description}</p>
        </div>

        <div className={styles.attributeGrid}>
          {attributeItems.map(({ label, value }) => (
            <div key={label} className={styles.attribute}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>

        <div className={styles.metaRow}>
          <span className={styles.metaChip}>
            <MapPin size={14} />
            {locationPrimary}
          </span>
          {isHousing && listing.housingDetails?.genderPreference ? (
            <span className={styles.metaChip}>
              {getHousingGenderLabel(listing.housingDetails.genderPreference)}
            </span>
          ) : null}
          {isHousing ? (
            <span className={styles.metaChip}>
              {getHousingPaymentLabel(listing.housingDetails?.paymentDay)}
            </span>
          ) : null}
          {locationSecondary ? (
            <span className={styles.metaChip}>{locationSecondary}</span>
          ) : null}
        </div>

        <div className={styles.sellerRow}>
          <span className={styles.avatar}>{getSellerInitials(listing.sellerName)}</span>
          <div className={styles.sellerCopy}>
            <strong>{listing.sellerName}</strong>
            <span>{listing.sellerCourse}</span>
          </div>
        </div>

        <div className={styles.footer}>
          <span className={styles.footerNote}>
            {listing.intent === "request" ? "Responder demanda" : "Ver detalhes"}
          </span>
          <span className={styles.footerAction}>
            Abrir
            <ArrowUpRight size={15} />
          </span>
        </div>
      </div>
    </Link>
  );
}
