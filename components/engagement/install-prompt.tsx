"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { Download, ShieldCheck, Wifi, WifiOff } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

export function InstallPrompt() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false);

  const syncState = useEffectEvent(() => {
    setIsOnline(window.navigator.onLine);
    setIsIos(/iPad|iPhone|iPod/i.test(window.navigator.userAgent));
    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        Boolean((window.navigator as NavigatorWithStandalone).standalone),
    );
  });

  useEffect(() => {
    syncState();

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker
        .register("/sw.js", {
          scope: "/",
        })
        .then(() => setServiceWorkerReady(true))
        .catch(() => setServiceWorkerReady(false));
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setInstallEvent(null);
      syncState();
    };

    const handleConnectivityChange = () => {
      syncState();
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt as EventListener,
    );
    window.addEventListener("appinstalled", handleInstalled);
    window.addEventListener("online", handleConnectivityChange);
    window.addEventListener("offline", handleConnectivityChange);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt as EventListener,
      );
      window.removeEventListener("appinstalled", handleInstalled);
      window.removeEventListener("online", handleConnectivityChange);
      window.removeEventListener("offline", handleConnectivityChange);
    };
  }, []);

  async function installApp() {
    if (!installEvent) {
      return;
    }

    await installEvent.prompt();
    const choice = await installEvent.userChoice;

    if (choice.outcome === "accepted") {
      setInstallEvent(null);
    }
  }

  return (
    <aside className="install-card">
      <span className="account-chip">
        <Download size={16} />
        App
      </span>
      <h3>Levar pro celular</h3>
      <p>Abrir mais rapido.</p>

      <div className="install-status">
        <span
          className="status-pill"
          data-tone={serviceWorkerReady ? "success" : "info"}
        >
          <ShieldCheck size={14} />
          {isStandalone
            ? "Instalado"
            : installEvent
              ? "Pronto"
              : serviceWorkerReady
                ? "Disponivel"
                : "Navegador"}
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
      ) : installEvent ? (
        <button className="action-button" type="button" onClick={installApp}>
          Instalar app
        </button>
      ) : (
        <div className="status-banner" data-tone="info">
          {isIos
            ? "Adiciona a tela inicial no Safari."
            : "Instala pelo menu do navegador."}
        </div>
      )}
    </aside>
  );
}
