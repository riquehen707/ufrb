import styles from "@/components/home/home-purpose-strip.module.scss";

const signals = [
  "Trocas mais simples",
  "Renda extra entre estudantes",
  "Aulas, grupos e apoio",
];

export function HomePurposeStrip() {
  return (
    <section className="section">
      <div className="container">
        <div className={styles.panel}>
          <div className={styles.copy}>
            <span className="eyebrow">Por que existe</span>
            <h2>Facilitar trocas, renda extra e estudos no ritmo do campus.</h2>
            <p>
              O CAMPUS aproxima quem quer vender, aprender, dividir moradia,
              encontrar carona ou organizar grupos.
            </p>
          </div>

          <div className={styles.signalRow} aria-label="Principais utilidades">
            {signals.map((signal) => (
              <span key={signal} className={styles.signalPill}>
                {signal}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
