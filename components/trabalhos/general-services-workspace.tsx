import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCent,
  Home,
  MapPin,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";

import styles from "@/components/trabalhos/general-services-workspace.module.scss";
import type { Listing } from "@/lib/listings";

type Props = {
  listings: Listing[];
};

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

function getLocation(listing: Listing) {
  return listing.locationNote ?? listing.campus;
}

export function GeneralServicesWorkspace({ listings }: Props) {
  const offers = listings.filter((listing) => listing.intent === "offer");
  const requests = listings.filter((listing) => listing.intent === "request");
  const scopes = Array.from(
    new Set(listings.map((listing) => listing.focus).filter(Boolean)),
  ).slice(0, 6) as string[];
  const averageBudget = listings.length
    ? listings.reduce((total, listing) => total + listing.price, 0) / listings.length
    : 0;

  return (
    <div className={styles.stack}>
      <section className={styles.highlightGrid}>
        <article className={styles.highlightCard}>
          <Sparkles size={18} />
          <strong>{offers.length}</strong>
          <span>prestadores</span>
        </article>
        <article className={styles.highlightCard}>
          <Wrench size={18} />
          <strong>{requests.length}</strong>
          <span>demandas</span>
        </article>
        <article className={styles.highlightCard}>
          <BadgeCent size={18} />
          <strong>
            {averageBudget ? moneyFormatter.format(averageBudget) : "Sem faixa"}
          </strong>
          <span>media anunciada</span>
        </article>
      </section>

      {scopes.length ? (
        <div className={styles.scopeRow} aria-label="Recortes mais publicados">
          {scopes.map((scope) => (
            <span key={scope} className={styles.scopeChip}>
              {scope}
            </span>
          ))}
        </div>
      ) : null}

      <section className={styles.board}>
        <article className={styles.column}>
          <div className={styles.columnHeader}>
            <div>
              <span className="eyebrow">Demandas</span>
              <h2>Casas precisando resolver</h2>
            </div>
            <span className={styles.countLabel}>{requests.length}</span>
          </div>

          <div className={styles.cardStack}>
            {requests.length ? (
              requests.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/anuncios/${listing.id}`}
                  className={styles.serviceCard}
                >
                  <div className={styles.topline}>
                    <span className="status-pill" data-tone="info">
                      Demanda
                    </span>
                    {listing.focus ? (
                      <span className="status-pill" data-tone="warning">
                        {listing.focus}
                      </span>
                    ) : null}
                  </div>

                  <h3>{listing.title}</h3>
                  <p>{listing.description}</p>

                  <div className={styles.metaRow}>
                    <span>
                      <MapPin size={14} />
                      {getLocation(listing)}
                    </span>
                    <span>{moneyFormatter.format(listing.price)}</span>
                  </div>

                  <div className={styles.footer}>
                    <span>{listing.sellerName}</span>
                    <span>
                      Abrir
                      <ArrowUpRight size={15} />
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className={styles.emptyState}>
                <strong>Sem demandas reais por enquanto.</strong>
                <p>Quando alguem publicar um pedido de casa, ele aparece aqui.</p>
              </div>
            )}
          </div>
        </article>

        <article className={styles.column}>
          <div className={styles.columnHeader}>
            <div>
              <span className="eyebrow">Prestadores</span>
              <h2>Quem esta oferecendo servico</h2>
            </div>
            <span className={styles.countLabel}>{offers.length}</span>
          </div>

          <div className={styles.cardStack}>
            {offers.length ? (
              offers.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/anuncios/${listing.id}`}
                  className={styles.serviceCard}
                >
                  <div className={styles.topline}>
                    <span className="status-pill" data-tone="success">
                      Oferta
                    </span>
                    {listing.focus ? (
                      <span className="status-pill" data-tone="warning">
                        {listing.focus}
                      </span>
                    ) : null}
                  </div>

                  <h3>{listing.title}</h3>
                  <p>{listing.description}</p>

                  <div className={styles.metaRow}>
                    <span>
                      <Home size={14} />
                      {getLocation(listing)}
                    </span>
                    <span>{moneyFormatter.format(listing.price)}</span>
                  </div>

                  <div className={styles.profileRow}>
                    <div>
                      <strong>{listing.sellerName}</strong>
                      <span>{listing.sellerCourse}</span>
                    </div>
                    <span className={styles.trustChip}>
                      <ShieldCheck size={14} />
                      {listing.rating.toFixed(1)}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className={styles.emptyState}>
                <strong>Nenhum servico publicado ainda.</strong>
                <p>Assim que entrarem anuncios reais, essa vitrine passa a refletir o Supabase.</p>
              </div>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
