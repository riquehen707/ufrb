"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Coins, Sparkles } from "lucide-react";

import styles from "@/components/profile/profile-listing-actions.module.scss";
import { TokenActionModal } from "@/components/tokens/token-action-modal";
import type { Listing } from "@/lib/listings";
import {
  getFeatureListingTokenCost,
  getRenewListingTokenCost,
} from "@/lib/monetization/token-costs";
import type { PlanType } from "@/lib/monetization/types";

type PaidAction = "renew" | "feature";

type Props = {
  listings: Listing[];
  tokenBalance: number;
  planType: PlanType;
};

type MessageState =
  | {
      tone: "success" | "error";
      text: string;
    }
  | null;

type DialogState = {
  listingId: string;
  action: PaidAction;
  mode: "confirm" | "insufficient";
} | null;

function formatDate(value?: string) {
  if (!value) {
    return "Sem data";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

export function ProfileListingActions({
  listings,
  tokenBalance,
  planType,
}: Props) {
  const router = useRouter();
  const [balance, setBalance] = useState(tokenBalance);
  const [message, setMessage] = useState<MessageState>(null);
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [isPending, startTransition] = useTransition();

  const renewalCost = getRenewListingTokenCost();
  const featureCost = getFeatureListingTokenCost();

  const managedListings = useMemo(() => listings.slice(0, 6), [listings]);
  const activeListing = managedListings.find(
    (listing) => listing.id === dialogState?.listingId,
  );
  const activeCost =
    dialogState?.action === "feature" ? featureCost.amount : renewalCost.amount;

  useEffect(() => {
    setBalance(tokenBalance);
  }, [tokenBalance]);

  function openAction(listingId: string, action: PaidAction) {
    const cost = action === "feature" ? featureCost.amount : renewalCost.amount;
    setMessage(null);
    setDialogState({
      listingId,
      action,
      mode: balance >= cost ? "confirm" : "insufficient",
    });
  }

  function closeDialog() {
    setDialogState(null);
  }

  function submitAction() {
    if (!dialogState || !activeListing) {
      return;
    }

    const endpoint =
      dialogState.action === "feature"
        ? "/api/listings/feature"
        : "/api/listings/renew";

    startTransition(() => {
      void (async () => {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            listingId: activeListing.id,
          }),
        });

        const payload = (await response.json().catch(() => null)) as
          | {
              error?: string;
              tokenCost?: number;
              tokenBalance?: number | null;
            }
          | null;

        if (!response.ok) {
          const errorText =
            payload?.error ??
            (dialogState.action === "feature"
              ? "Nao foi possivel destacar o anuncio."
              : "Nao foi possivel renovar o anuncio.");

          if (response.status === 409) {
            setDialogState((current) =>
              current
                ? {
                    ...current,
                    mode: "insufficient",
                  }
                : current,
            );
          }

          setMessage({
            tone: "error",
            text: errorText,
          });
          return;
        }

        const spentTokens = payload?.tokenCost ?? activeCost;
        const nextBalance =
          payload?.tokenBalance ?? Math.max(balance - spentTokens, 0);

        setBalance(nextBalance);
        setDialogState(null);
        setMessage({
          tone: "success",
          text:
            dialogState.action === "feature"
              ? `Anuncio destacado. Voce usou ${spentTokens} token${spentTokens > 1 ? "s" : ""}.`
              : `Anuncio renovado. Voce usou ${spentTokens} token${spentTokens > 1 ? "s" : ""}.`,
        });
        router.refresh();
      })();
    });
  }

  if (!managedListings.length) {
    return null;
  }

  return (
    <section className={styles.shell}>
      <div className={styles.header}>
        <div className={styles.copy}>
          <strong>Acoes pagas</strong>
          <span>Renova ou destaca teus anuncios sem sair do painel.</span>
        </div>
        <span className={styles.tokenSummary}>
          <Coins size={14} />
          {balance} token{balance > 1 ? "s" : ""} -{" "}
          {planType === "pro" ? "Pro" : "Free"}
        </span>
      </div>

      {message ? (
        <div className="status-banner" data-tone={message.tone}>
          {message.text}
        </div>
      ) : null}

      <div className={styles.list}>
        {managedListings.map((listing) => (
          <article key={listing.id} className={styles.item}>
            <div className={styles.topline}>
              <div className={styles.copy}>
                <strong>{listing.title}</strong>
                <span>{listing.category}</span>
              </div>
              <div className={styles.meta}>
                <span className={styles.metaPill}>
                  {listing.listingTier === "premium" ? "Premium" : "Simples"}
                </span>
                {listing.featured ? (
                  <span className={styles.metaPill}>Em destaque</span>
                ) : null}
                <span className={styles.metaPill}>
                  Expira {formatDate(listing.expiresAt)}
                </span>
              </div>
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.actionButton}
                onClick={() => openAction(listing.id, "renew")}
              >
                <span className={styles.actionCopy}>
                  <span className={styles.actionTitle}>
                    <CalendarClock size={15} />
                    Renovar por 30 dias
                  </span>
                  <span className={styles.actionHint}>Mantem o anuncio circulando</span>
                </span>
                <span className={styles.actionCost}>
                  {renewalCost.amount} token
                </span>
              </button>

              <button
                type="button"
                className={styles.actionButton}
                onClick={() => openAction(listing.id, "feature")}
              >
                <span className={styles.actionCopy}>
                  <span className={styles.actionTitle}>
                    <Sparkles size={15} />
                    Destacar por 7 dias
                  </span>
                  <span className={styles.actionHint}>Aumenta a prioridade no feed</span>
                </span>
                <span className={styles.actionCost}>
                  {featureCost.amount} token
                </span>
              </button>
            </div>
          </article>
        ))}
      </div>

      <TokenActionModal
        open={Boolean(dialogState && activeListing)}
        mode={dialogState?.mode}
        title={
          dialogState?.action === "feature"
            ? "Destacar anuncio"
            : "Renovar anuncio"
        }
        description={
          activeListing
            ? dialogState?.action === "feature"
              ? `Destacar "${activeListing.title}" aumenta a prioridade dele no feed.`
              : `Renovar "${activeListing.title}" empurra a expiracao e mantem o anuncio circulando.`
            : ""
        }
        cost={activeCost}
        balance={balance}
        helperText={
          dialogState?.action === "feature"
            ? "O destaque fica ativo por 7 dias."
            : "A renovacao adiciona mais 30 dias."
        }
        confirmLabel={
          dialogState?.action === "feature" ? "Destacar agora" : "Renovar agora"
        }
        isPending={isPending}
        onClose={closeDialog}
        onConfirm={submitAction}
      />
    </section>
  );
}
