import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-copy">
          <strong>CAMPUS</strong>
          <p>Trocas, renda extra e estudos entre estudantes.</p>
        </div>

        <div className="footer-signals" aria-label="Acoes do rodape">
          <Link href="/doar" className="footer-inline-link">
            Apoiar o CAMPUS
          </Link>
        </div>
      </div>
    </footer>
  );
}
