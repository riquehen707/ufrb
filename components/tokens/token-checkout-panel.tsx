"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Crown, LoaderCircle, QrCode } from "lucide-react";

import styles from "@/components/tokens/token-hub.module.scss";
import {
  TOKEN_PACKAGES,
  type TokenPackageCode,
} from "@/lib/monetization/token-packages";

type TokenPaymentHistoryItem = {
  id: string;
  packageCode?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  expiresAt?: string;
};

type TokenSubscriptionSummary = {
  status: "inactive" | "active" | "past_due" | "cancelled";
  currentPeriodEnd?: string;
};

type PurchaseMessage =
  | {
      tone: "success" | "error";
      text: string;
    }
  | null;

type CheckoutResult =
  | {
      qrCode?: string;
      qrCodeBase64?: string;
      expiresAt?: string;
      paymentId?: string;
      packageCode?: string;
    }
  | null;

type Props = {
  profile: {
    fullName: string;
    contactEmail?: string;
    contactPhone?: string;
    tokenBalance: number;
    planType: "free" | "pro";
  };
  activeSubscription: TokenSubscriptionSummary | null;
  pendingTokenPayment: TokenPaymentHistoryItem | null;
  pendingSubscriptionPayment: TokenPaymentHistoryItem | null;
};

type BillingDraft = {
  customerName?: string;
  customerEmail?: string;
  customerDocument?: string;
  customerPhone?: string;
};

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const BILLING_STORAGE_KEY = "campus.tokens.billing-draft";

function formatDateTime(value?: string) {
  if (!value) {
    return "Assim que confirmar";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatPhone(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}

function formatDocument(value: string) {
  return value.replace(/\D/g, "").slice(0, 14);
}

function getBillingValidationMessage(input: {
  customerName: string;
  customerEmail: string;
  customerDocument: string;
  customerPhone: string;
}) {
  if (!input.customerName.trim()) {
    return "Preenche teu nome para continuar.";
  }

  if (!input.customerEmail.trim()) {
    return "Preenche teu e-mail para continuar.";
  }

  if (!input.customerDocument.trim()) {
    return "Preenche CPF ou CNPJ para continuar.";
  }

  if (!input.customerPhone.trim()) {
    return "Preenche teu celular para continuar.";
  }

  return null;
}

function PixPreview({
  title,
  subtitle,
  result,
  onCopy,
}: {
  title: string;
  subtitle: string;
  result: CheckoutResult;
  onCopy: () => Promise<void>;
}) {
  if (!result) {
    return null;
  }

  return (
    <div className={styles.historyCard}>
      <div className={styles.historyHeader}>
        <div>
          <strong>{title}</strong>
          <span>{subtitle}</span>
        </div>
        <span className="status-pill" data-tone="info">
          Aguardando pagamento
        </span>
      </div>

      {result.qrCodeBase64 ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`data:image/png;base64,${result.qrCodeBase64}`}
          alt="QR Code Pix"
          style={{ width: "100%", maxWidth: "16rem", borderRadius: "16px" }}
        />
      ) : null}

      {result.qrCode ? (
        <div className={styles.card}>
          <div className={styles.historyCopy}>
            <strong>Copia e cola</strong>
            <p>{result.qrCode}</p>
          </div>
          <button type="button" className="secondary-button" onClick={() => void onCopy()}>
            <Copy size={16} />
            Copiar Pix
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function TokenCheckoutPanel({
  profile,
  activeSubscription,
  pendingTokenPayment,
  pendingSubscriptionPayment,
}: Props) {
  const router = useRouter();
  const [packageCode, setPackageCode] = useState<TokenPackageCode>("starter");
  const [customerName, setCustomerName] = useState(profile.fullName);
  const [customerEmail, setCustomerEmail] = useState(profile.contactEmail ?? "");
  const [customerDocument, setCustomerDocument] = useState("");
  const [customerPhone, setCustomerPhone] = useState(
    formatPhone(profile.contactPhone ?? ""),
  );
  const [purchaseMessage, setPurchaseMessage] = useState<PurchaseMessage>(null);
  const [tokenPurchaseResult, setTokenPurchaseResult] = useState<CheckoutResult>(
    pendingTokenPayment
      ? {
          qrCode: pendingTokenPayment.qrCode,
          qrCodeBase64: pendingTokenPayment.qrCodeBase64,
          expiresAt: pendingTokenPayment.expiresAt,
          paymentId: pendingTokenPayment.id,
          packageCode: pendingTokenPayment.packageCode,
        }
      : null,
  );
  const [subscriptionPurchaseResult, setSubscriptionPurchaseResult] =
    useState<CheckoutResult>(
      pendingSubscriptionPayment
        ? {
            qrCode: pendingSubscriptionPayment.qrCode,
            qrCodeBase64: pendingSubscriptionPayment.qrCodeBase64,
            expiresAt: pendingSubscriptionPayment.expiresAt,
            paymentId: pendingSubscriptionPayment.id,
          }
        : null,
    );
  const [isBuyingPackage, setIsBuyingPackage] = useState(false);
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false);

  const selectedPackage = useMemo(() => TOKEN_PACKAGES[packageCode], [packageCode]);

  useEffect(() => {
    try {
      const rawDraft = window.localStorage.getItem(BILLING_STORAGE_KEY);

      if (!rawDraft) {
        return;
      }

      const draft = JSON.parse(rawDraft) as BillingDraft;

      if (draft.customerName?.trim()) {
        setCustomerName(draft.customerName.trim());
      }

      if (draft.customerEmail?.trim()) {
        setCustomerEmail(draft.customerEmail.trim());
      }

      if (draft.customerDocument?.trim()) {
        setCustomerDocument(formatDocument(draft.customerDocument));
      }

      if (draft.customerPhone?.trim()) {
        setCustomerPhone(formatPhone(draft.customerPhone));
      }
    } catch {
      // Ignore storage parse errors and keep the in-memory defaults.
    }
  }, []);

  useEffect(() => {
    const draft: BillingDraft = {
      customerName,
      customerEmail,
      customerDocument,
      customerPhone,
    };

    try {
      window.localStorage.setItem(BILLING_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Ignore storage failures and keep the checkout working.
    }
  }, [customerDocument, customerEmail, customerName, customerPhone]);

  async function handlePackagePurchase() {
    setPurchaseMessage(null);

    const billingValidationMessage = getBillingValidationMessage({
      customerName,
      customerEmail,
      customerDocument,
      customerPhone,
    });

    if (billingValidationMessage) {
      setPurchaseMessage({
        tone: "error",
        text: billingValidationMessage,
      });
      return;
    }

    setIsBuyingPackage(true);

    try {
      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          packageCode,
          customerName,
          customerEmail,
          customerDocument,
          customerPhone,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            error?: string;
            qrCode?: string | null;
            qrCodeBase64?: string | null;
            expiresAt?: string | null;
            paymentId?: string;
            package?: { code?: string };
          }
        | null;

      if (!response.ok) {
        setPurchaseMessage({
          tone: "error",
          text: payload?.error ?? "Nao foi possivel criar a cobranca agora.",
        });
        return;
      }

      setTokenPurchaseResult({
        qrCode: payload?.qrCode ?? undefined,
        qrCodeBase64: payload?.qrCodeBase64 ?? undefined,
        expiresAt: payload?.expiresAt ?? undefined,
        paymentId: payload?.paymentId,
        packageCode: payload?.package?.code,
      });
      setPurchaseMessage({
        tone: "success",
        text: "Pix gerado. Assim que o PicPay confirmar, os tokens entram no saldo.",
      });
      router.refresh();
    } finally {
      setIsBuyingPackage(false);
    }
  }

  async function handleSubscriptionCreate() {
    setPurchaseMessage(null);

    const billingValidationMessage = getBillingValidationMessage({
      customerName,
      customerEmail,
      customerDocument,
      customerPhone,
    });

    if (billingValidationMessage) {
      setPurchaseMessage({
        tone: "error",
        text: billingValidationMessage,
      });
      return;
    }

    setIsCreatingSubscription(true);

    try {
      const response = await fetch("/api/subscriptions/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerDocument,
          customerPhone,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            error?: string;
            qrCode?: string | null;
            qrCodeBase64?: string | null;
            expiresAt?: string | null;
            paymentId?: string;
          }
        | null;

      if (!response.ok) {
        setPurchaseMessage({
          tone: "error",
          text: payload?.error ?? "Nao foi possivel gerar o Pix do plano Pro agora.",
        });
        return;
      }

      setSubscriptionPurchaseResult({
        qrCode: payload?.qrCode ?? undefined,
        qrCodeBase64: payload?.qrCodeBase64 ?? undefined,
        expiresAt: payload?.expiresAt ?? undefined,
        paymentId: payload?.paymentId,
      });
      setPurchaseMessage({
        tone: "success",
        text: "Pix do Pro gerado. Quando o pagamento confirmar, teu ciclo de 30 dias entra no ar.",
      });
      router.refresh();
    } finally {
      setIsCreatingSubscription(false);
    }
  }

  async function copyPixCode(code?: string) {
    if (!code) {
      return;
    }

    await navigator.clipboard.writeText(code);
    setPurchaseMessage({
      tone: "success",
      text: "Codigo Pix copiado.",
    });
  }

  return (
    <section className={styles.card} id="packages">
      <div className={styles.sectionHeader}>
        <div>
          <strong>Comprar saldo e Pro</strong>
          <span>Compra avulsa por Pix para manter o ritmo ou ativar 30 dias de Pro.</span>
        </div>
      </div>

      {purchaseMessage ? (
        <div className="status-banner" data-tone={purchaseMessage.tone}>
          {purchaseMessage.text}
        </div>
      ) : null}

      <section className={styles.card}>
        <div className={styles.sectionHeader}>
          <div>
            <strong>Dados para gerar o Pix</strong>
            <span>Usados no Pix dos pacotes e tambem no Pix do plano Pro.</span>
          </div>
        </div>

        <div className="field-grid">
          <div className="field">
            <label htmlFor="token-customer-name">Nome</label>
            <input
              id="token-customer-name"
              className="input-field"
              autoComplete="name"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="Nome completo"
            />
          </div>
          <div className="field">
            <label htmlFor="token-customer-email">E-mail</label>
            <input
              id="token-customer-email"
              className="input-field"
              type="email"
              autoComplete="email"
              value={customerEmail}
              onChange={(event) => setCustomerEmail(event.target.value)}
              placeholder="teuemail@..."
            />
          </div>
        </div>

        <div className="field-grid">
          <div className="field">
            <label htmlFor="token-customer-document">CPF ou CNPJ</label>
            <input
              id="token-customer-document"
              className="input-field"
              inputMode="numeric"
              autoComplete="off"
              value={customerDocument}
              onChange={(event) => setCustomerDocument(formatDocument(event.target.value))}
              placeholder="Somente numeros"
            />
          </div>
          <div className="field">
            <label htmlFor="token-customer-phone">Celular</label>
            <input
              id="token-customer-phone"
              className="input-field"
              inputMode="tel"
              autoComplete="tel"
              value={customerPhone}
              onChange={(event) => setCustomerPhone(formatPhone(event.target.value))}
              placeholder="DDD + numero"
            />
          </div>
        </div>

        <p className={styles.helper}>
          Esses dados ficam prontos para as proximas compras neste aparelho.
        </p>
      </section>

      <div className={styles.compareGrid}>
        {Object.values(TOKEN_PACKAGES).map((entry) => (
          <button
            key={entry.code}
            type="button"
            className={styles.compareCard}
            onClick={() => setPackageCode(entry.code)}
            aria-pressed={packageCode === entry.code}
          >
            <div className={styles.compareHead}>
              <strong>{entry.label}</strong>
              <span>{moneyFormatter.format(entry.amountCents / 100)}</span>
            </div>
            <ul className={styles.featureList}>
              <li>
                <span className={styles.bullet}>
                  <Check size={12} />
                </span>
                Compra unica, sem assinatura
              </li>
              <li>
                <span className={styles.bullet}>
                  <Check size={12} />
                </span>
                Entra no saldo assim que o Pix confirmar
              </li>
            </ul>
          </button>
        ))}
      </div>

      <div className={styles.card}>
        <div className={styles.sectionHeader}>
          <div>
            <strong>Comprar pacote</strong>
            <span>
              {selectedPackage.label} por{" "}
              {moneyFormatter.format(selectedPackage.amountCents / 100)}
            </span>
          </div>
        </div>

        <p className={styles.helper}>
          Esse pacote libera {selectedPackage.tokenAmount} tokens assim que o Pix confirmar.
        </p>

        <div className={styles.heroActions}>
          <button
            type="button"
            className="primary-button"
            onClick={() => void handlePackagePurchase()}
            disabled={isBuyingPackage}
          >
            {isBuyingPackage ? (
              <>
                <LoaderCircle size={16} />
                Criando Pix...
              </>
            ) : (
              <>
                <QrCode size={16} />
                Comprar {selectedPackage.label}
              </>
            )}
          </button>
          <Link href="#pro" className="secondary-button">
            Ver plano Pro
          </Link>
        </div>

        <PixPreview
          title="Pix do pacote"
          subtitle={`Expira em ${formatDateTime(tokenPurchaseResult?.expiresAt)}`}
          result={tokenPurchaseResult}
          onCopy={() => copyPixCode(tokenPurchaseResult?.qrCode)}
        />
      </div>

      <section className={styles.card} id="pro">
        <div className={styles.sectionHeader}>
          <div>
            <strong>Plano Pro</strong>
            <span>R$ 19,90 por 30 dias - 40 tokens por ciclo pago.</span>
          </div>
          <span
            className="status-pill"
            data-tone={profile.planType === "pro" ? "success" : "warning"}
          >
            {profile.planType === "pro" ? "Pro ativo" : "Upgrade"}
          </span>
        </div>

        {activeSubscription ? (
          <div className={styles.historyCard}>
            <div className={styles.historyHeader}>
              <div>
                <strong>Pro ativo</strong>
                <span>
                  {activeSubscription.currentPeriodEnd
                    ? `Vai ate ${formatDateTime(activeSubscription.currentPeriodEnd)}`
                    : "Ciclo em andamento"}
                </span>
              </div>
            </div>
            <p className={styles.helper}>
              Tu pode gerar um novo Pix quando quiser renovar por mais 30 dias.
            </p>
          </div>
        ) : (
          <p className={styles.helper}>
            O Pro libera 40 tokens, selo visual e prioridade moderada por 30 dias.
          </p>
        )}

        <div className={styles.heroActions}>
          <button
            type="button"
            className="primary-button"
            onClick={() => void handleSubscriptionCreate()}
            disabled={isCreatingSubscription}
          >
            {isCreatingSubscription ? (
              <>
                <LoaderCircle size={16} />
                Criando Pix do Pro...
              </>
            ) : (
              <>
                <Crown size={16} />
                {profile.planType === "pro" ? "Renovar Pro por Pix" : "Ativar Pro por Pix"}
              </>
            )}
          </button>
        </div>

        <PixPreview
          title="Pix do Pro"
          subtitle={`Expira em ${formatDateTime(subscriptionPurchaseResult?.expiresAt)}`}
          result={subscriptionPurchaseResult}
          onCopy={() => copyPixCode(subscriptionPurchaseResult?.qrCode)}
        />
      </section>
    </section>
  );
}
