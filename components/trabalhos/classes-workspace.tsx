import { BookOpenText, Coins, GraduationCap, UsersRound } from "lucide-react";

import {
  classDemands,
  studyGroups,
  teacherProfiles,
} from "@/lib/work-hub";

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export function ClassesWorkspace() {
  return (
    <div className="work-stack">
      <section className="work-highlight-grid">
        <article className="work-metric-card">
          <GraduationCap size={18} />
          <strong>{teacherProfiles.length}</strong>
          <span>professores</span>
        </article>
        <article className="work-metric-card">
          <BookOpenText size={18} />
          <strong>{classDemands.length}</strong>
          <span>demandas</span>
        </article>
        <article className="work-metric-card">
          <UsersRound size={18} />
          <strong>{studyGroups.length}</strong>
          <span>turmas</span>
        </article>
      </section>

      <section className="work-split-grid">
        <article className="work-card work-card-strong">
          <div className="work-card-header">
            <div>
              <span className="eyebrow">Ensinar</span>
              <h2>Demandas e turmas</h2>
            </div>
          </div>

          <div className="work-board-grid">
            {classDemands.map((demand) => (
              <article key={demand.id} className="work-demand-card">
                <div className="work-demand-topline">
                  <span className="status-pill" data-tone="info">
                    {demand.audience}
                  </span>
                  <span className="status-pill" data-tone="warning">
                    {demand.format}
                  </span>
                </div>

                <h4>{demand.title}</h4>
                <p>{demand.location}</p>

                <div className="work-demand-meta">
                  <span>
                    <Coins size={14} />
                    ate {moneyFormatter.format(demand.budget)} / hora
                  </span>
                  <span>
                    <UsersRound size={14} />
                    {demand.studentsWaiting} aluno(s) esperando
                  </span>
                </div>

                <div className="work-inline-note">{demand.timing}</div>
                <button type="button" className="primary-button">
                  Entrar nessa demanda
                </button>
              </article>
            ))}
          </div>
        </article>

        <article className="work-card">
          <div className="work-card-header">
            <div>
              <span className="eyebrow">Aprender</span>
              <h3>Professores e grupos</h3>
            </div>
          </div>

          <div className="work-list-stack">
            {teacherProfiles.map((teacher) => (
              <article key={teacher.id} className="work-profile-card">
                <div className="work-profile-main">
                  <div>
                    <strong>{teacher.name}</strong>
                    <p>{teacher.headline}</p>
                  </div>
                  <div className="work-profile-meta">
                    <span>{teacher.campus}</span>
                    <span>Nota geral {teacher.reliability.toFixed(1)}</span>
                    <span>Aulas {teacher.rating.toFixed(1)}</span>
                  </div>
                </div>

                <div className="tag-row">
                  {teacher.specialties.map((specialty) => (
                    <span key={specialty} className="tag">
                      {specialty}
                    </span>
                  ))}
                </div>

                <div className="work-action-row">
                  {teacher.actions.map((action) => (
                    <button key={action} type="button" className="ghost-button">
                      {action}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="work-card">
        <div className="work-card-header">
          <div>
            <span className="eyebrow">Grupos</span>
            <h3>Turmas abertas</h3>
          </div>
        </div>

        <div className="work-board-grid">
          {studyGroups.map((group) => (
            <article key={group.id} className="work-demand-card">
              <div className="work-demand-topline">
                <span className="status-pill" data-tone="success">
                  {group.audience}
                </span>
                <span className="status-pill" data-tone="info">
                  {group.openSlots}/{group.totalSlots} vagas
                </span>
              </div>

              <h4>{group.title}</h4>
              <p>{group.location}</p>

              <div className="work-demand-meta">
                <span>{group.timing}</span>
                <span>{moneyFormatter.format(group.perStudent)} por aluno</span>
              </div>

              <button type="button" className="secondary-button">
                Inscrever-se no grupo
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
