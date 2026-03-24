"use client";

import { Download } from "lucide-react";

import { useInstallPrompt } from "@/components/engagement/install-provider";

type Props = {
  className?: string;
  hiddenWhenInstalled?: boolean;
};

export function InstallAppButton({ className, hiddenWhenInstalled = false }: Props) {
  const { installLabel, isStandalone, openInstall } = useInstallPrompt();

  if (hiddenWhenInstalled && isStandalone) {
    return null;
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => void openInstall()}
      disabled={isStandalone}
    >
      <Download size={18} />
      {isStandalone ? "App instalado" : installLabel}
    </button>
  );
}
