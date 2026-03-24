import styles from "@/components/home/home-purpose-strip.module.scss";

const signals = [
  "Dar aulas e monitoria",
  "Ganhar dinheiro com o que voce sabe fazer",
  "Compartilhar moradia",
  "Resolver a vida no campus",
];

export function HomePurposeStrip() {
  return (
    <section className="section">
      <div className="container">
        <div className={styles.panel}>
          <div className={styles.copy}>
            <span className="eyebrow">Por que existe</span>
            <h2>Transformar a vida universitaria em rede de renda, troca e autonomia.</h2>
            <p>
              O CAMPUS conecta estudantes que ensinam, vendem, prestam servicos,
              compartilham moradia e resolvem problemas reais da rotina universitaria.
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
