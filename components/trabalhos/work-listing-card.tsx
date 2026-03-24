import Link from "next/link";
import { ArrowUpRight, BadgeCent, MapPin, ShieldCheck } from "lucide-react";

import styles from "@/components/trabalhos/work-listing-card.module.scss";
import type { Listing } from "@/lib/listings";
import {
  formatWorkListingPrice,
  getListingLocationLabel,
} from "@/lib/work-hub";

type Props = {
  listing: Listing;
  actionLabel: string;
};

function getListingRatingLabel(rating: number) {
  return rating > 0 ? rating.toFixed(1) : "Sem avaliacoes";
}

export function WorkListingCard({ listing, actionLabel }: Props) {
  const intentTone = listing.intent === "offer" ? "success" : "info";
  const intentLabel = listing.intent === "offer" ? "Oferta" : "Demanda";

  return (
    <Link href={`/anuncios/${listing.id}`} className={styles.card}>
      <div className={styles.topline}>
        <span className="status-pill" data-tone={intentTone}>
          {intentLabel}
        </span>
        {listing.focus ? (
          <span className={styles.focusChip}>{listing.focus}</span>
        ) : null}
      </div>

      <div className={styles.copy}>
        <h3>{listing.title}</h3>
        <p>{listing.description}</p>
      </div>

      <div className={styles.metaRow}>
        <span>
          <MapPin size={14} />
          {getListingLocationLabel(listing)}
        </span>
        <span>
          <BadgeCent size={14} />
          {formatWorkListingPrice(listing)}
        </span>
      </div>

      <div className={styles.footer}>
        <div className={styles.seller}>
          <strong>{listing.sellerName}</strong>
          <span>{listing.sellerCourse}</span>
        </div>

        <div className={styles.side}>
          <span className={styles.rating}>
            <ShieldCheck size={14} />
            {getListingRatingLabel(listing.rating)}
          </span>
          <span className={styles.action}>
            {actionLabel}
            <ArrowUpRight size={15} />
          </span>
        </div>
      </div>
    </Link>
  );
}
