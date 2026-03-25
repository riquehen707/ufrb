"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  BusFront,
  GraduationCap,
  House,
  type LucideIcon,
  MapPin,
  Package,
} from "lucide-react";

import styles from "@/components/marketplace/marketplace-lane-card.module.scss";
import {
  getHousingGenderLabel,
  getHousingPaymentLabel,
  housingListingKindLabels,
} from "@/lib/housing";
import type { Listing } from "@/lib/listings";
import { getListingLocationPrimary } from "@/lib/location";
import {
  itemConditionLabels,
  listingIntentLabels,
  negotiationModeLabels,
} from "@/lib/listing-taxonomy";

type LaneId = "products" | "housing" | "classes" | "services";
type LaneTone = LaneId | "transport";

type Props = {
  listing: Listing;
  laneId: LaneTone;
  priceHeadline: string;
};

function getSellerInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getLaneMeta(listing: Listing, laneId: LaneTone) {
  if (laneId === "housing" && listing.housingDetails) {
    return {
      kicker: housingListingKindLabels[listing.housingDetails.listingKind],
      detail: listing.housingDetails.genderPreference
        ? getHousingGenderLabel(listing.housingDetails.genderPreference)
        : getHousingPaymentLabel(listing.housingDetails.paymentDay),
    };
  }

  if (laneId === "classes") {
    return {
      kicker: listing.focus ?? "Aulas e ajuda academica",
      detail: listing.priceUnit ? `Valor ${listing.priceUnit}` : "A combinar",
    };
  }

  if (laneId === "services") {
    return {
      kicker: listing.focus ?? listing.category,
      detail: negotiationModeLabels[listing.negotiationMode],
    };
  }

  if (laneId === "transport") {
    return {
      kicker: listing.focus ?? "Rota compartilhada",
      detail: listing.deliveryMode,
    };
  }

  return {
    kicker: listing.itemCondition
      ? itemConditionLabels[listing.itemCondition]
      : listing.category,
    detail: listing.deliveryMode,
  };
}

const laneIcons: Record<LaneTone, LucideIcon> = {
  products: Package,
  housing: House,
  classes: GraduationCap,
  services: BriefcaseBusiness,
  transport: BusFront,
};

export function MarketplaceLaneCard({ listing, laneId, priceHeadline }: Props) {
  const LaneIcon = laneIcons[laneId];
  const location = getListingLocationPrimary(listing);
  const meta = getLaneMeta(listing, laneId);

  return (
    <Link
      href={`/anuncios/${listing.id}`}
      className={styles.card}
      data-lane={laneId}
      aria-label={`Abrir anuncio: ${listing.title}`}
    >
      <div className={styles.media}>
        {listing.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.imageUrl} alt="" className={styles.image} loading="lazy" />
        ) : (
          <div className={styles.placeholder}>
            <LaneIcon size={24} />
          </div>
        )}

        <div className={styles.mediaScrim} />

        <div className={styles.topline}>
          <span className={styles.intentPill}>{listingIntentLabels[listing.intent]}</span>
          <span className={styles.kickerPill}>{meta.kicker}</span>
        </div>

        <div className={styles.priceBadge}>{priceHeadline}</div>
      </div>

      <div className={styles.body}>
        <div className={styles.summary}>
          <strong>{listing.title}</strong>
          <span>{meta.detail}</span>
        </div>

        <div className={styles.metaRow}>
          <span className={styles.metaChip}>
            <MapPin size={13} />
            {location}
          </span>
        </div>

        <div className={styles.footer}>
          <span className={styles.sellerChip}>{getSellerInitials(listing.sellerName)}</span>
          <span className={styles.footerCopy}>{listing.sellerName}</span>
          <span className={styles.footerAction}>
            Abrir
            <ArrowUpRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}
