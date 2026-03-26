import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-copy">
          <strong>CAMPUS</strong>
          <p>Rede universitaria para renda, troca, estudo e autonomia real.</p>
        </div>

        <div className="footer-signals" aria-label="Acoes do rodape">
          <Link href="/anunciar" className="footer-inline-link">
            Publicar no CAMPUS
          </Link>
          <Link href="/tokens" className="footer-inline-link">
            Planos e tokens
          </Link>
        </div>
      </div>
    </footer>
  );
}
