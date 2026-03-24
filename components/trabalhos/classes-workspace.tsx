import { BookOpenText, GraduationCap, UsersRound } from "lucide-react";

import styles from "@/components/trabalhos/classes-workspace.module.scss";
import { WorkListingCard } from "@/components/trabalhos/work-listing-card";
import type { Listing } from "@/lib/listings";
import { getTopWorkFocuses, getWorkListingStats } from "@/lib/work-hub";

type Props = {
  listings: Listing[];
};

export function ClassesWorkspace({ listings }: Props) {
  const stats = getWorkListingStats(listings);
  const offers = listings.filter((listing) => listing.intent === "offer");
  const requests = listings.filter((listing) => listing.intent === "request");
  const groupListings = listings.filter((listing) =>
    listing.focus?.toLowerCase().includes("grupo"),
  );
  const focuses = getTopWorkFocuses(listings);

  return (
    <div className={styles.stack}>
      <section className={styles.metrics}>
        <article className={styles.metricCard}>
          <GraduationCap size={18} />
          <strong>{offers.length}</strong>
          <span>quem pode ensinar</span>
        </article>
        <article className={styles.metricCard}>
          <BookOpenText size={18} />
          <strong>{requests.length}</strong>
          <span>pedidos de ajuda</span>
        </article>
        <article className={styles.metricCard}>
          <UsersRound size={18} />
          <strong>{groupListings.length}</strong>
          <span>formatos em grupo</span>
        </article>
      </section>

      {focuses.length ? (
        <div className={styles.focusRow} aria-label="Recortes de aulas">
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
              <span className="eyebrow">Quem pode ensinar</span>
              <h2>Professores, monitores e grupos abertos</h2>
            </div>
            <span className={styles.countChip}>{offers.length}</span>
          </div>

          {offers.length ? (
            <div className={styles.cardGrid}>
              {offers.map((listing) => (
                <WorkListingCard
                  key={listing.id}
                  listing={listing}
                  actionLabel="Ver oportunidade"
                />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <strong>Ainda nao existe nenhuma aula publicada nessa area.</strong>
              <p>
                Quando estudantes publicarem aulas e monitorias reais, elas aparecem aqui.
              </p>
            </div>
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className="eyebrow">Pedidos de ajuda</span>
              <h2>Demandas abertas para professor ou monitor</h2>
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
              <strong>Sem demandas abertas por enquanto.</strong>
              <p>Assim que alguem pedir ajuda academica, essa lista se atualiza.</p>
            </div>
          )}
        </article>
      </section>

      {stats.total ? (
        <div className={styles.noteCard}>
          <strong>Como usar melhor essa aba</strong>
          <p>
            Publicacoes com foco claro como particular, grupo, banca ou ensino medio
            ficam muito mais faceis de encontrar aqui.
          </p>
        </div>
      ) : null}
    </div>
  );
}
