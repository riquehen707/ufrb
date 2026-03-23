"use client";

import {
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useState,
  type ReactNode,
} from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
  brave?: {
    isBrave?: () => Promise<boolean>;
  };
};

type BrowserKind =
  | "chrome"
  | "brave"
  | "edge"
  | "firefox"
  | "safari"
  | "samsung"
  | "opera"
  | "unknown";

type InstallContextValue = {
  browser: BrowserKind;
  browserLabel: string;
  canInstallDirectly: boolean;
  installHint: string;
  installLabel: string;
  installStatusLabel: string;
  installSectionId: string;
  isMobile: boolean;
  isOnline: boolean;
  isStandalone: boolean;
  serviceWorkerReady: boolean;
  openInstall: () => Promise<void>;
  promptInstall: () => Promise<void>;
};

const INSTALL_SECTION_ID = "baixar-app";

const InstallContext = createContext<InstallContextValue | null>(null);

const browserLabels: Record<BrowserKind, string> = {
  chrome: "Chrome",
  brave: "Brave",
  edge: "Edge",
  firefox: "Firefox",
  safari: "Safari",
  samsung: "Samsung Internet",
  opera: "Opera",
  unknown: "Navegador",
};

function scrollToInstallSection() {
  document.getElementById(INSTALL_SECTION_ID)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

async function detectBrowser(): Promise<BrowserKind> {
  const navigatorLike = window.navigator as NavigatorWithStandalone;
  const userAgent = navigatorLike.userAgent.toLowerCase();

  if (navigatorLike.brave?.isBrave) {
    try {
      if (await navigatorLike.brave.isBrave()) {
        return "brave";
      }
    } catch {
      // Ignore Brave detection failures and continue with UA heuristics.
    }
  }

  if (userAgent.includes("edg/")) {
    return "edge";
  }

  if (userAgent.includes("samsungbrowser")) {
    return "samsung";
  }

  if (userAgent.includes("firefox") || userAgent.includes("fxios")) {
    return "firefox";
  }

  if (userAgent.includes("opr/") || userAgent.includes("opera")) {
    return "opera";
  }

  if (
    (userAgent.includes("chrome") || userAgent.includes("crios")) &&
    !userAgent.includes("edg/") &&
    !userAgent.includes("opr/")
  ) {
    return "chrome";
  }

  if (userAgent.includes("safari")) {
    return "safari";
  }

  return "unknown";
}

function getInstallCopy(options: {
  browser: BrowserKind;
  canInstallDirectly: boolean;
  isIos: boolean;
  isMobile: boolean;
  isStandalone: boolean;
  serviceWorkerReady: boolean;
}) {
  const browserLabel = browserLabels[options.browser];

  if (options.isStandalone) {
    return {
      browserLabel,
      installHint: "Ja esta instalado no teu aparelho.",
      installLabel: "App instalado",
      installStatusLabel: "Instalado",
    };
  }

  if (options.canInstallDirectly) {
    return {
      browserLabel,
      installHint: `Abrir o prompt direto do ${browserLabel}.`,
      installLabel: "Instalar agora",
      installStatusLabel: "Pronto",
    };
  }

  if (options.isIos) {
    return {
      browserLabel,
      installHint: "Usa Compartilhar e adiciona a tela inicial.",
      installLabel: "Ver instalacao",
      installStatusLabel: "Menu",
    };
  }

  if (options.browser === "firefox") {
    return {
      browserLabel,
      installHint: options.isMobile
        ? "Abre o menu do Firefox e adiciona a tela inicial."
        : "No desktop, abre no Chrome, Brave ou Edge para instalar como app.",
      installLabel: "Ver instalacao",
      installStatusLabel: options.isMobile ? "Menu" : "Alternativa",
    };
  }

  if (options.browser === "safari") {
    return {
      browserLabel,
      installHint: options.isMobile
        ? "Usa Compartilhar e adiciona a tela inicial."
        : "No Safari do macOS, usa Arquivo e adiciona ao Dock.",
      installLabel: "Ver instalacao",
      installStatusLabel: "Menu",
    };
  }

  if (options.browser === "chrome" || options.browser === "brave" || options.browser === "edge") {
    return {
      browserLabel,
      installHint: "Se o prompt nao abrir, usa o menu do navegador.",
      installLabel: "Instalar app",
      installStatusLabel: options.serviceWorkerReady ? "Disponivel" : "Navegador",
    };
  }

  return {
    browserLabel,
    installHint: "Instala pelo menu do navegador.",
    installLabel: "Ver instalacao",
    installStatusLabel: options.serviceWorkerReady ? "Disponivel" : "Navegador",
  };
}

export function InstallProvider({ children }: { children: ReactNode }) {
  const [browser, setBrowser] = useState<BrowserKind>("unknown");
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false);

  const syncRuntime = useEffectEvent(() => {
    const navigatorLike = window.navigator as NavigatorWithStandalone;
    setIsOnline(navigatorLike.onLine);
    setIsIos(/iPad|iPhone|iPod/i.test(navigatorLike.userAgent));
    setIsMobile(window.matchMedia("(max-width: 820px)").matches);
    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        Boolean(navigatorLike.standalone),
    );
  });

  useEffect(() => {
    syncRuntime();
    void detectBrowser().then(setBrowser);

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
      syncRuntime();
    };

    const handleRuntimeChange = () => {
      syncRuntime();
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt as EventListener,
    );
    window.addEventListener("appinstalled", handleInstalled);
    window.addEventListener("online", handleRuntimeChange);
    window.addEventListener("offline", handleRuntimeChange);
    window.addEventListener("resize", handleRuntimeChange);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt as EventListener,
      );
      window.removeEventListener("appinstalled", handleInstalled);
      window.removeEventListener("online", handleRuntimeChange);
      window.removeEventListener("offline", handleRuntimeChange);
      window.removeEventListener("resize", handleRuntimeChange);
    };
  }, []);

  async function promptInstall() {
    if (!installEvent) {
      return;
    }

    await installEvent.prompt();
    const choice = await installEvent.userChoice;

    if (choice.outcome === "accepted") {
      setInstallEvent(null);
    }
  }

  async function openInstall() {
    if (installEvent) {
      await promptInstall();
      return;
    }

    scrollToInstallSection();
  }

  const copy = getInstallCopy({
    browser,
    canInstallDirectly: Boolean(installEvent),
    isIos,
    isMobile,
    isStandalone,
    serviceWorkerReady,
  });

  const value: InstallContextValue = {
    browser,
    browserLabel: copy.browserLabel,
    canInstallDirectly: Boolean(installEvent),
    installHint: copy.installHint,
    installLabel: copy.installLabel,
    installSectionId: INSTALL_SECTION_ID,
    installStatusLabel: copy.installStatusLabel,
    isMobile,
    isOnline,
    isStandalone,
    serviceWorkerReady,
    openInstall,
    promptInstall,
  };

  return (
    <InstallContext.Provider value={value}>{children}</InstallContext.Provider>
  );
}

export function useInstallPrompt() {
  const context = useContext(InstallContext);

  if (!context) {
    throw new Error("useInstallPrompt must be used within InstallProvider.");
  }

  return context;
}
