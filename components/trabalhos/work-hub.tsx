"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock3, Route, ShieldCheck } from "lucide-react";

import { ClassesWorkspace } from "@/components/trabalhos/classes-workspace";
import { GeneralServicesWorkspace } from "@/components/trabalhos/general-services-workspace";
import { TransportWorkspace } from "@/components/trabalhos/transport-workspace";
import { WorkTabNav } from "@/components/trabalhos/work-tab-nav";
import styles from "@/components/trabalhos/work-hub.module.scss";
import { getWorkTab, type WorkTabId, workTabs } from "@/lib/work-hub";

type Props = {
  initialTab: WorkTabId;
};

const tabHighlights: Record<
  WorkTabId,
  Array<{ label: string; value: string; icon: typeof Clock3 }>
> = {
  transporte: [
    { label: "Horarios", value: "saida e volta", icon: Clock3 },
    { label: "Rota", value: "distancia e rateio", icon: Route },
    { label: "Confianca", value: "ocupacao e nota", icon: ShieldCheck },
  ],
  aulas: [
    { label: "Formato", value: "particular ou grupo", icon: Clock3 },
    { label: "Jornada", value: "prof e aluno", icon: Route },
    { label: "Confianca", value: "nota e recorrencia", icon: ShieldCheck },
  ],
  servicos: [
    { label: "Escopo", value: "pedido claro", icon: Clock3 },
    { label: "Local", value: "casa e campus", icon: Route },
    { label: "Confianca", value: "perfil e nota", icon: ShieldCheck },
  ],
};

export function WorkHub({ initialTab }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<WorkTabId>(initialTab);
  const activeConfig = getWorkTab(activeTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const nextHref =
      activeTab === "transporte"
        ? "/trabalhos"
        : `/trabalhos?aba=${activeTab}`;

    router.replace(nextHref, { scroll: false });
  }, [activeTab, router]);

  return (
    <section className={styles.hub} data-tab={activeTab}>
      <div className={styles.hero}>
        <div className={styles.copy}>
          <span className="eyebrow">Trabalhos</span>
          <h2>{activeConfig.title}</h2>
          <p>{activeConfig.description}</p>
        </div>

        <div className={styles.summaryGrid}>
          {tabHighlights[activeTab].map(({ label, value, icon: Icon }) => (
            <article key={label} className={styles.summaryCard}>
              <Icon size={16} />
              <strong>{label}</strong>
              <span>{value}</span>
            </article>
          ))}
        </div>
      </div>

      <div className={styles.navWrap}>
        <WorkTabNav tabs={workTabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      <div className={styles.body}>
        <div className={styles.workspaceFrame}>
          {activeTab === "transporte" ? <TransportWorkspace /> : null}
          {activeTab === "aulas" ? <ClassesWorkspace /> : null}
          {activeTab === "servicos" ? <GeneralServicesWorkspace /> : null}
        </div>
      </div>
    </section>
  );
}
