"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCent, BriefcaseBusiness, BusFront, GraduationCap } from "lucide-react";

import { ClassesWorkspace } from "@/components/trabalhos/classes-workspace";
import { GeneralServicesWorkspace } from "@/components/trabalhos/general-services-workspace";
import { TransportWorkspace } from "@/components/trabalhos/transport-workspace";
import { WorkTabNav } from "@/components/trabalhos/work-tab-nav";
import styles from "@/components/trabalhos/work-hub.module.scss";
import type { Listing } from "@/lib/listings";
import {
  getWorkListingStats,
  getWorkTab,
  type WorkTabId,
  workTabs,
} from "@/lib/work-hub";

type Props = {
  initialTab: WorkTabId;
  classListings: Listing[];
  transportListings: Listing[];
  serviceListings: Listing[];
};

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

function getStatCards(tabId: WorkTabId, listings: Listing[]) {
  const stats = getWorkListingStats(listings);

  if (tabId === "aulas") {
    const groupCount = listings.filter((listing) =>
      listing.focus?.toLowerCase().includes("grupo"),
    ).length;

    return [
      {
        label: "Quem ensina",
        value: String(stats.offers),
        icon: GraduationCap,
      },
      {
        label: "Pedidos",
        value: String(stats.requests),
        icon: BriefcaseBusiness,
      },
      {
        label: "Grupo",
        value: String(groupCount),
        icon: BadgeCent,
      },
    ];
  }

  if (tabId === "transporte") {
    return [
      {
        label: "Rotas",
        value: String(stats.offers),
        icon: BusFront,
      },
      {
        label: "Pedidos",
        value: String(stats.requests),
        icon: BriefcaseBusiness,
      },
      {
        label: "Campi",
        value: String(stats.campusCount || 1),
        icon: BadgeCent,
      },
    ];
  }

  return [
    {
      label: "Prestadores",
      value: String(stats.offers),
      icon: BriefcaseBusiness,
    },
    {
      label: "Demandas",
      value: String(stats.requests),
      icon: GraduationCap,
    },
    {
      label: "Faixa media",
      value: stats.averagePrice ? moneyFormatter.format(stats.averagePrice) : "Sem faixa",
      icon: BadgeCent,
    },
  ];
}

export function WorkHub({
  initialTab,
  classListings,
  transportListings,
  serviceListings,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<WorkTabId>(initialTab);

  const listingsByTab = useMemo(
    () => ({
      aulas: classListings,
      transporte: transportListings,
      servicos: serviceListings,
    }),
    [classListings, serviceListings, transportListings],
  );

  const counts = useMemo(
    () => ({
      aulas: classListings.length,
      transporte: transportListings.length,
      servicos: serviceListings.length,
    }),
    [classListings.length, serviceListings.length, transportListings.length],
  );

  const activeConfig = getWorkTab(activeTab);
  const activeListings = listingsByTab[activeTab];
  const statCards = getStatCards(activeTab, activeListings);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const nextHref =
      activeTab === "transporte" ? "/trabalhos" : `/trabalhos?aba=${activeTab}`;

    router.replace(nextHref, { scroll: false });
  }, [activeTab, router]);

  return (
    <section className={styles.hub} data-tab={activeTab}>
      <div className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className="eyebrow">Trabalhos</span>
          <h1>{activeConfig.title}</h1>
          <p>{activeConfig.description}</p>
        </div>

        <div className={styles.heroStats}>
          {statCards.map(({ label, value, icon: Icon }) => (
            <article key={label} className={styles.statCard}>
              <Icon size={18} />
              <strong>{value}</strong>
              <span>{label}</span>
            </article>
          ))}
        </div>
      </div>

      <div className={styles.navWrap}>
        <WorkTabNav
          tabs={workTabs}
          activeTab={activeTab}
          counts={counts}
          onChange={setActiveTab}
        />
      </div>

      <div className={styles.workspace}>
        {activeTab === "transporte" ? (
          <TransportWorkspace listings={transportListings} />
        ) : null}
        {activeTab === "aulas" ? <ClassesWorkspace listings={classListings} /> : null}
        {activeTab === "servicos" ? (
          <GeneralServicesWorkspace listings={serviceListings} />
        ) : null}
      </div>
    </section>
  );
}
