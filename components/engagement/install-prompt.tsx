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

  if (isStandalone) {
    return null;
  }

  return (
    <aside className="install-card install-card-compact" id="baixar-app">
      <span className="account-chip">
        <Download size={16} />
        App
      </span>
      <h3>No celular fica mais rapido</h3>
      <p>
        {canInstallDirectly
          ? `${browserLabel} ja pode instalar o CAMPUS como app.`
          : `Se quiser usar como app, instala pelo ${browserLabel}.`}
      </p>

      <div className="install-card-row">
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

        {canInstallDirectly ? (
        <button className="action-button" type="button" onClick={() => void promptInstall()}>
          {installLabel}
        </button>
        ) : (
        <div className="install-inline-note">
          {installHint}
        </div>
        )}
      </div>
    </aside>
  );
}
