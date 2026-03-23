import { BookOpenText, BusFront, Wrench } from "lucide-react";

import styles from "@/components/trabalhos/work-tab-nav.module.scss";
import type { WorkTab, WorkTabId } from "@/lib/work-hub";

type Props = {
  tabs: WorkTab[];
  activeTab: WorkTabId;
  onChange: (nextTab: WorkTabId) => void;
};

function getTabIcon(tabId: WorkTabId) {
  if (tabId === "transporte") {
    return BusFront;
  }

  if (tabId === "aulas") {
    return BookOpenText;
  }

  return Wrench;
}

export function WorkTabNav({ tabs, activeTab, onChange }: Props) {
  return (
    <div className={styles.strip} role="tablist" aria-label="Areas de trabalho">
      {tabs.map((tab) => {
        const Icon = getTabIcon(tab.id);

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ""}`}
            aria-selected={activeTab === tab.id}
            onClick={() => onChange(tab.id)}
          >
            <span className={styles.icon}>
              <Icon size={18} />
            </span>
            <span className={styles.copy}>
              <strong>{tab.label}</strong>
              <span>{tab.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
