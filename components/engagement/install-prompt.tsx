"use client";

import { Download, ShieldCheck, Wifi, WifiOff } from "lucide-react";

import { useInstallPrompt } from "@/components/engagement/install-provider";

export function InstallPrompt() {
  const {
    browserLabel,
    canInstallDirectly,
    installHint,
    installLabel,
    installStatusLabel,
    isOnline,
    isStandalone,
    promptInstall,
    serviceWorkerReady,
  } = useInstallPrompt();

  return (
    <aside className="install-card">
      <span className="account-chip">
        <Download size={16} />
        App
      </span>
      <h3>Levar pro celular</h3>
      <p>{browserLabel}</p>

      <div className="install-status">
        <span
          className="status-pill"
          data-tone={serviceWorkerReady ? "success" : "info"}
        >
          <ShieldCheck size={14} />
          {installStatusLabel}
        </span>
        <span
          className="status-pill"
          data-tone={isOnline ? "success" : "warning"}
        >
          {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
          {isOnline ? "Online" : "Offline"}
        </span>
      </div>

      {isStandalone ? (
        <div className="status-banner" data-tone="success">
          Ja esta no teu celular.
        </div>
      ) : canInstallDirectly ? (
        <button className="action-button" type="button" onClick={() => void promptInstall()}>
          {installLabel}
        </button>
      ) : (
        <div className="status-banner" data-tone="info">
          {installHint}
        </div>
      )}
    </aside>
  );
}
