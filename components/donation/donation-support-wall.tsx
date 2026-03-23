import Link from "next/link";

import styles from "@/components/donation/donation-support-wall.module.scss";
import type { DonationOverview } from "@/lib/donations";

type Props = {
  overview: DonationOverview;
};

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(date));
}

export function DonationSupportWall({ overview }: Props) {
  return (
    <section className={styles.wall}>
      <div className={styles.header}>
        <div>
          <span className="eyebrow">Apoiadores</span>
          <h2>Quem ja fortaleceu o CAMPUS</h2>
        </div>
        <div className={styles.summaryGrid}>
          <article className={styles.summaryCard}>
            <span>Total confirmado</span>
            <strong>{moneyFormatter.format(overview.totalConfirmed)}</strong>
          </article>
          <article className={styles.summaryCard}>
            <span>Apoiadores</span>
            <strong>{overview.supporterCount}</strong>
          </article>
        </div>
      </div>

      {overview.recentSupporters.length ? (
        <div className={styles.list}>
          {overview.recentSupporters.map((supporter) => {
            const content = (
              <article className={styles.entry}>
                <div className={styles.entryCopy}>
                  <strong>{supporter.donorName}</strong>
                  <span>{formatDate(supporter.confirmedAt)}</span>
                </div>
                <strong className={styles.amount}>
                  {moneyFormatter.format(supporter.amount)}
                </strong>
              </article>
            );

            return supporter.supporterProfileId ? (
              <Link
                key={supporter.id}
                href={`/perfil/${supporter.supporterProfileId}`}
                className={styles.entryLink}
              >
                {content}
              </Link>
            ) : (
              <div key={supporter.id}>{content}</div>
            );
          })}
        </div>
      ) : (
        <div className={styles.empty}>
          <strong>Ainda sem apoios confirmados.</strong>
          <p>Os primeiros apoiadores aparecem aqui assim que o pagamento for confirmado.</p>
        </div>
      )}
    </section>
  );
}
