"use client";

import { Download } from "lucide-react";

import { useInstallPrompt } from "@/components/engagement/install-provider";

type Props = {
  className?: string;
  hiddenWhenInstalled?: boolean;
  labelOverride?: string;
};

export function InstallAppButton({
  className,
  hiddenWhenInstalled = false,
  labelOverride,
}: Props) {
  const { installLabel, isStandalone, openInstall } = useInstallPrompt();
  const buttonLabel = isStandalone ? "App instalado" : labelOverride ?? installLabel;

  if (hiddenWhenInstalled && isStandalone) {
    return null;
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => void openInstall()}
      disabled={isStandalone}
      aria-label={buttonLabel}
      title={buttonLabel}
    >
      <Download size={18} />
      {buttonLabel}
    </button>
  );
}
