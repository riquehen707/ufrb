"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Coins, Crown, X } from "lucide-react";

import styles from "@/components/tokens/token-action-modal.module.scss";

type Props = {
  open: boolean;
  mode?: "confirm" | "insufficient";
  title: string;
  description: string;
  cost: number;
  balance: number | null;
  confirmLabel?: string;
  helperText?: string;
  isPending?: boolean;
  onClose: () => void;
  onConfirm?: () => void;
};

export function TokenActionModal({
  open,
  mode = "confirm",
  title,
  description,
  cost,
  balance,
  confirmLabel = "Confirmar",
  helperText,
  isPending = false,
  onClose,
  onConfirm,
}: Props) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const remainingBalance =
    balance === null ? null : Math.max(balance - cost, 0);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <section
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="token-action-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <div className={styles.heading}>
            <h3 id="token-action-modal-title">{title}</h3>
            <p>{description}</p>
          </div>

          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Fechar modal"
          >
            <X size={16} />
          </button>
        </div>

        <div className={styles.metrics}>
          <article className={styles.metricCard}>
            <span>Custo</span>
            <strong>{cost} token{cost > 1 ? "s" : ""}</strong>
          </article>
          <article className={styles.metricCard}>
            <span>Saldo</span>
            <strong>
              {balance === null ? "Indisponivel" : `${balance} token${balance > 1 ? "s" : ""}`}
            </strong>
          </article>
          {remainingBalance !== null ? (
            <article className={styles.metricCard}>
              <span>Depois da acao</span>
              <strong>
                {remainingBalance} token{remainingBalance > 1 ? "s" : ""}
              </strong>
            </article>
          ) : null}
        </div>

        {helperText ? <p className={styles.helper}>{helperText}</p> : null}

        {mode === "insufficient" ? (
          <div className={styles.paywallActions}>
            <p className={styles.paywallCopy}>
              Compre mais tokens ou assine o plano Pro para continuar sem travar teu fluxo.
            </p>
            <div className={styles.actions}>
              <Link href="/tokens#packages" className="primary-button" onClick={onClose}>
                <Coins size={16} />
                Comprar tokens
              </Link>
              <Link href="/tokens#pro" className="secondary-button" onClick={onClose}>
                <Crown size={16} />
                Assinar Pro
              </Link>
            </div>
          </div>
        ) : (
          <div className={styles.actions}>
            <button
              type="button"
              className="primary-button"
              onClick={onConfirm}
              disabled={isPending}
            >
              {isPending ? "Processando..." : confirmLabel}
            </button>
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancelar
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
