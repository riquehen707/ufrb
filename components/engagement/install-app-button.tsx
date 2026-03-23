"use client";

import { Download } from "lucide-react";

import { useInstallPrompt } from "@/components/engagement/install-provider";

type Props = {
  className?: string;
};

export function InstallAppButton({ className }: Props) {
  const { installLabel, isStandalone, openInstall } = useInstallPrompt();

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
