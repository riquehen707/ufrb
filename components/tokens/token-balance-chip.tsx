import Link from "next/link";
import { Coins } from "lucide-react";

import type { PlanType } from "@/lib/monetization/types";
import styles from "@/components/tokens/token-balance-chip.module.scss";

type Props = {
  tokenBalance: number;
  planType: PlanType;
  href?: string;
};

export function TokenBalanceChip({
  tokenBalance,
  planType,
  href = "/tokens",
}: Props) {
  return (
    <Link
      href={href}
      className={styles.chip}
      aria-label={`Voce tem ${tokenBalance} tokens`}
      title="Abrir planos e tokens"
    >
      <span className={styles.icon}>
        <Coins size={15} />
      </span>
      <strong className={styles.value}>{tokenBalance}</strong>
      {planType === "pro" ? <span className={styles.plan}>Pro</span> : null}
    </Link>
  );
}
