import { Home, ShieldCheck, Sparkles, Wrench } from "lucide-react";

import { generalServiceRequests } from "@/lib/work-hub";

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const serviceScopes = [
  "Faxina",
  "Montagem",
  "Pequenos reparos",
  "Lavanderia",
  "Instalacao de tela",
] as const;

export function GeneralServicesWorkspace() {
  return (
    <div className="work-stack">
      <section className="work-highlight-grid">
        <article className="work-metric-card">
          <Sparkles size={18} />
          <strong>Casa</strong>
          <span>faxina e rotina</span>
        </article>
        <article className="work-metric-card">
          <Wrench size={18} />
          <strong>Reparos</strong>
          <span>tela, montagem e ajuste</span>
        </article>
        <article className="work-metric-card">
          <ShieldCheck size={18} />
          <strong>Perfil</strong>
          <span>reputacao no mesmo lugar</span>
        </article>
      </section>

      <section className="work-card work-card-strong">
        <div className="work-card-header">
          <div>
            <span className="eyebrow">Servicos gerais</span>
            <h2>Pedidos da casa</h2>
          </div>
        </div>

        <div className="tag-row">
          {serviceScopes.map((scope) => (
            <span key={scope} className="tag">
              {scope}
            </span>
          ))}
        </div>

      </section>

      <section className="work-board-grid">
        {generalServiceRequests.map((request) => (
          <article key={request.id} className="work-demand-card">
            <div className="work-demand-topline">
              <span className="status-pill" data-tone="warning">
                {request.urgency}
              </span>
              <span className="status-pill" data-tone="info">
                {request.category}
              </span>
            </div>

            <h4>{request.title}</h4>
            <p>{request.note}</p>

            <div className="work-demand-meta">
              <span>
                <Home size={14} />
                {request.place}
              </span>
              <span>{moneyFormatter.format(request.budget)}</span>
            </div>

            <button type="button" className="secondary-button">
              Responder demanda
            </button>
          </article>
        ))}
      </section>
    </div>
  );
}
