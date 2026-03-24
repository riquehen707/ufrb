import { BadgeCent, Sparkles, Wrench } from "lucide-react";

import styles from "@/components/trabalhos/general-services-workspace.module.scss";
import { WorkListingCard } from "@/components/trabalhos/work-listing-card";
import type { Listing } from "@/lib/listings";
import { getTopWorkFocuses, getWorkListingStats } from "@/lib/work-hub";

type Props = {
  listings: Listing[];
};

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export function GeneralServicesWorkspace({ listings }: Props) {
  const stats = getWorkListingStats(listings);
  const offers = listings.filter((listing) => listing.intent === "offer");
  const requests = listings.filter((listing) => listing.intent === "request");
  const focuses = getTopWorkFocuses(listings);

  return (
    <div className={styles.stack}>
      <section className={styles.metrics}>
        <article className={styles.metricCard}>
          <Sparkles size={18} />
          <strong>{offers.length}</strong>
          <span>prestadores</span>
        </article>
        <article className={styles.metricCard}>
          <Wrench size={18} />
          <strong>{requests.length}</strong>
          <span>demandas</span>
        </article>
        <article className={styles.metricCard}>
          <BadgeCent size={18} />
          <strong>
            {stats.averagePrice ? moneyFormatter.format(stats.averagePrice) : "Sem faixa"}
          </strong>
          <span>media anunciada</span>
        </article>
      </section>

      {focuses.length ? (
        <div className={styles.focusRow} aria-label="Recortes mais publicados">
          {focuses.map((focus) => (
            <span key={focus} className={styles.focusChip}>
              {focus}
            </span>
          ))}
        </div>
      ) : null}

      <section className={styles.board}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className="eyebrow">Demandas</span>
              <h2>Casas e estudantes precisando resolver</h2>
            </div>
            <span className={styles.countChip}>{requests.length}</span>
          </div>

          {requests.length ? (
            <div className={styles.cardGrid}>
              {requests.map((listing) => (
                <WorkListingCard
                  key={listing.id}
                  listing={listing}
                  actionLabel="Responder demanda"
                />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <strong>Sem demandas reais por enquanto.</strong>
              <p>Quando alguem publicar um pedido de servico, ele aparece aqui.</p>
            </div>
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className="eyebrow">Prestadores</span>
              <h2>Quem esta oferecendo servico</h2>
            </div>
            <span className={styles.countChip}>{offers.length}</span>
          </div>

          {offers.length ? (
            <div className={styles.cardGrid}>
              {offers.map((listing) => (
                <WorkListingCard
                  key={listing.id}
                  listing={listing}
                  actionLabel="Ver servico"
                />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <strong>Nenhum servico publicado ainda.</strong>
              <p>Assim que entrarem anuncios reais, essa vitrine passa a refletir o Supabase.</p>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
