import Link from "next/link";
import { ArrowRight, Coins, Crown, History, Wallet } from "lucide-react";

import { AuthPanel } from "@/components/auth/auth-panel";
import { TokenCheckoutPanel } from "@/components/tokens/token-checkout-panel";
import styles from "@/components/tokens/token-hub.module.scss";
import { TOKEN_COSTS } from "@/lib/monetization/token-costs";
import {
  getTokenPackage,
  isTokenPackageCode,
} from "@/lib/monetization/token-packages";
import {
  getLowBalanceThreshold,
  getNextMonthlyGrantDate,
  getPlanConfig,
} from "@/lib/monetization/plans";
import {
  paymentStatusLabels,
  subscriptionStatusLabels,
  tokenTransactionReasonLabels,
} from "@/lib/monetization/token-copy";
import type {
  TokenDashboardData,
  TokenPaymentHistoryItem,
} from "@/lib/token-dashboard";

type Props = {
  dashboard: TokenDashboardData | null;
};

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatDate(value?: string | Date | null) {
  if (!value) {
    return "Sem data";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function getPackageEntry(packageCode?: string) {
  if (!packageCode || !isTokenPackageCode(packageCode)) {
    return null;
  }

  return getTokenPackage(packageCode);
}

function getPendingPaymentCopy(
  pendingTokenPayment: TokenPaymentHistoryItem | null,
  pendingSubscriptionPayment: TokenPaymentHistoryItem | null,
) {
  if (pendingSubscriptionPayment) {
    return "Teu Pix do Pro ja esta pronto. Quando confirmar, o acesso de 30 dias entra no ar.";
  }

  if (!pendingTokenPayment) {
    return null;
  }

  const packageEntry = getPackageEntry(pendingTokenPayment.packageCode);

  if (packageEntry) {
    return `Teu Pix do pacote ${packageEntry.label} esta pendente. Assim que pagar, os tokens entram no saldo.`;
  }

  return "Teu Pix de tokens esta pendente. Assim que pagar, os tokens entram no saldo.";
}

function getPaymentTitle(
  payment: TokenPaymentHistoryItem,
  proTokensPerCycle: number,
) {
  if (payment.kind === "subscription") {
    return "Plano Pro";
  }

  const packageEntry = getPackageEntry(payment.packageCode);

  if (packageEntry) {
    return packageEntry.label;
  }

  return payment.tokenAmount > 0
    ? `${payment.tokenAmount} tokens`
    : `${proTokensPerCycle} tokens`;
}

function getPaymentCopy(
  payment: TokenPaymentHistoryItem,
  proTokensPerCycle: number,
) {
  if (payment.kind === "subscription") {
    return `${proTokensPerCycle} tokens - ${paymentStatusLabels[payment.status]} - ${formatDate(payment.createdAt)}`;
  }

  const packageEntry = getPackageEntry(payment.packageCode);

  if (packageEntry) {
    return `${packageEntry.tokenAmount} tokens - ${paymentStatusLabels[payment.status]} - ${formatDate(payment.createdAt)}`;
  }

  return `${paymentStatusLabels[payment.status]} - ${formatDate(payment.createdAt)}`;
}

export function TokenHub({ dashboard }: Props) {
  if (!dashboard) {
    return (
      <section className={styles.shell}>
        <AuthPanel
          title="Entrar para usar tokens"
          description="Cria tua conta para publicar, comprar tokens e acompanhar o saldo num so lugar."
          initialMode="sign-up"
          redirectTo="/tokens"
        />
      </section>
    );
  }

  const {
    profile,
    transactions,
    payments,
    activeSubscription,
    pendingTokenPayment,
    pendingSubscriptionPayment,
  } = dashboard;
  const freePlan = getPlanConfig("free");
  const proPlan = getPlanConfig("pro");
  const lowBalanceThreshold = getLowBalanceThreshold(profile.planType);
  const isLowBalance = profile.tokenBalance <= lowBalanceThreshold;
  const nextFreeGrantDate =
    profile.planType === "free"
      ? getNextMonthlyGrantDate(profile.monthlyTokenLastGrantedAt)
      : null;
  const nextGrantLabel =
    profile.planType === "pro"
      ? activeSubscription?.currentPeriodEnd
        ? formatDate(activeSubscription.currentPeriodEnd)
        : "no proximo ciclo pago"
      : nextFreeGrantDate
        ? formatDate(nextFreeGrantDate)
        : "no proximo mes";
  const nextGrantCopy =
    profile.planType === "pro"
      ? activeSubscription?.currentPeriodEnd
        ? `Teu acesso Pro vai ate ${nextGrantLabel}.`
        : "Assim que o Pix confirmar, os 40 tokens entram no saldo."
      : nextFreeGrantDate
        ? `Proxima recarga prevista para ${nextGrantLabel}.`
        : "Proxima recarga prevista para o proximo mes.";
  const pendingPaymentCopy = getPendingPaymentCopy(
    pendingTokenPayment,
    pendingSubscriptionPayment,
  );

  return (
    <section className={styles.shell}>
      <section className={styles.hero}>
        <div className={styles.heroTop}>
          <div className={styles.heroCopy}>
            <span className="eyebrow">Planos e tokens</span>
            <h1>Voce tem {profile.tokenBalance} tokens</h1>
            <p>
              Usa o saldo para publicar, renovar e destacar anuncios sem travar a
              experiencia entre estudantes.
            </p>
          </div>
          <span className={styles.heroPlan}>
            {profile.planType === "pro" ? "Plano Pro" : "Plano Free"}
          </span>
        </div>

        <div className={styles.heroActions}>
          <Link href="/anunciar" className="primary-button">
            Criar anuncio
            <ArrowRight size={16} />
          </Link>
          <Link href="/perfil" className="secondary-button">
            Voltar ao painel
          </Link>
        </div>

        {isLowBalance ? (
          <div className="status-banner" data-tone="info">
            <strong>Saldo baixo.</strong>{" "}
            {`Compre mais tokens ou assine o plano Pro. ${nextGrantCopy}`}
          </div>
        ) : null}

        {pendingPaymentCopy ? (
          <div className="status-banner" data-tone="success">
            <strong>Pix pendente.</strong> {pendingPaymentCopy}
          </div>
        ) : null}

        <div className={styles.summaryGrid}>
          <article className={styles.metricCard}>
            <span>Saldo atual</span>
            <strong>{profile.tokenBalance} tokens</strong>
            <p className={styles.helper}>
              {profile.tokenBalance <= 0
                ? "Sem saldo para publicar agora."
                : `Criar anuncio simples custa ${TOKEN_COSTS.listing.simple}. Premium custa ${TOKEN_COSTS.listing.premium}.`}
            </p>
          </article>

          <article className={styles.metricCard}>
            <span>Plano</span>
            <strong>{profile.planType === "pro" ? "Pro" : "Free"}</strong>
            <p className={styles.helper}>
              {profile.planType === "pro"
                ? "Selo ativo e prioridade moderada nos anuncios."
                : "Interacao entre estudantes continua gratuita."}
            </p>
          </article>

          <article className={styles.metricCard}>
            <span>
              {profile.planType === "pro" ? "Credito do ciclo" : "Credito mensal"}
            </span>
            <strong>
              {profile.planType === "pro"
                ? `${proPlan.monthlyTokenGrant} tokens`
                : `${freePlan.monthlyTokenGrant} tokens`}
            </strong>
            <p className={styles.helper}>{nextGrantCopy}</p>
          </article>

          <article className={styles.metricCard}>
            <span>Tokens ganhos</span>
            <strong>{profile.tokenEarned}</strong>
            <p className={styles.helper}>
              Todo credito e debito entra no historico logo abaixo.
            </p>
          </article>
        </div>
      </section>

      <div className={styles.detailsGrid}>
        <TokenCheckoutPanel
          profile={profile}
          activeSubscription={activeSubscription}
          pendingTokenPayment={pendingTokenPayment}
          pendingSubscriptionPayment={pendingSubscriptionPayment}
        />

        <section className={styles.card}>
          <div className={styles.sectionHeader}>
            <div>
              <strong>Custos e entradas</strong>
              <span>O suficiente para entender o saldo sem ter que adivinhar.</span>
            </div>
          </div>

          <div className={styles.tokenCosts}>
            <div className={styles.tokenCostRow}>
              <div className={styles.historyCopy}>
                <strong>Novo usuario</strong>
                <p>
                  Recebe {freePlan.initialTokenGrant} tokens assim que cria a conta.
                </p>
              </div>
              <span className={styles.paymentAmount}>+{freePlan.initialTokenGrant}</span>
            </div>

            <div className={styles.tokenCostRow}>
              <div className={styles.historyCopy}>
                <strong>Free mensal</strong>
                <p>{freePlan.monthlyTokenGrant} tokens por mes.</p>
              </div>
              <span className={styles.paymentAmount}>+{freePlan.monthlyTokenGrant}</span>
            </div>

            <div className={styles.tokenCostRow}>
              <div className={styles.historyCopy}>
                <strong>Pro por 30 dias</strong>
                <p>
                  Usuarios Pro recebem {proPlan.monthlyTokenGrant} tokens por ciclo
                  pago.
                </p>
              </div>
              <span className={styles.paymentAmount}>+{proPlan.monthlyTokenGrant}</span>
            </div>

            <div className={styles.tokenCostRow}>
              <div className={styles.historyCopy}>
                <strong>Criar anuncio</strong>
                <p>
                  Simples custa {TOKEN_COSTS.listing.simple}. Premium custa{" "}
                  {TOKEN_COSTS.listing.premium}.
                </p>
              </div>
              <span className={styles.paymentAmount}>
                -{TOKEN_COSTS.listing.simple} / -{TOKEN_COSTS.listing.premium}
              </span>
            </div>

            <div className={styles.tokenCostRow}>
              <div className={styles.historyCopy}>
                <strong>Renovar ou destacar</strong>
                <p>Cada acao consome {TOKEN_COSTS.renewal} token.</p>
              </div>
              <span className={styles.paymentAmount}>-{TOKEN_COSTS.renewal}</span>
            </div>
          </div>
        </section>
      </div>

      <div className={styles.compareGrid}>
        <section className={styles.compareCard}>
          <div className={styles.compareHead}>
            <strong>Free</strong>
            <span>Para publicar com calma e comprar tokens quando precisar.</span>
          </div>
          <ul className={styles.featureList}>
            <li>
              <span className={styles.bullet}>
                <Wallet size={12} />
              </span>
              {freePlan.initialTokenGrant} tokens iniciais
            </li>
            <li>
              <span className={styles.bullet}>
                <Coins size={12} />
              </span>
              {freePlan.monthlyTokenGrant} tokens por mes
            </li>
            <li>
              <span className={styles.bullet}>
                <History size={12} />
              </span>
              Compra avulsa de tokens quando quiser
            </li>
          </ul>
        </section>

        <section className={styles.compareCard}>
          <div className={styles.compareHead}>
            <strong>Pro</strong>
            <span>
              {moneyFormatter.format(proPlan.monthlyPriceCents / 100)} por 30 dias,
              sem renovacao automatica.
            </span>
          </div>
          <ul className={styles.featureList}>
            <li>
              <span className={styles.bullet}>
                <Crown size={12} />
              </span>
              {proPlan.monthlyTokenGrant} tokens por ciclo pago
            </li>
            <li>
              <span className={styles.bullet}>
                <Crown size={12} />
              </span>
              Selo visual discreto no perfil
            </li>
            <li>
              <span className={styles.bullet}>
                <Crown size={12} />
              </span>
              Prioridade moderada nos anuncios
            </li>
          </ul>
          {activeSubscription ? (
            <p className={styles.helper}>
              Status atual: {subscriptionStatusLabels[activeSubscription.status]}.{" "}
              {activeSubscription.currentPeriodEnd
                ? `Vai ate ${formatDate(activeSubscription.currentPeriodEnd)}.`
                : "Aguardando a confirmacao final do ciclo."}
            </p>
          ) : null}
        </section>
      </div>

      <div className={styles.historyGrid}>
        <section className={styles.historyCard}>
          <div className={styles.historyHeader}>
            <div>
              <strong>Historico de tokens</strong>
              <span>Entradas e saidas mais recentes no teu saldo.</span>
            </div>
          </div>

          {transactions.length ? (
            <div className={styles.historyList}>
              {transactions.map((transaction) => (
                <article key={transaction.id} className={styles.historyRow}>
                  <div className={styles.historyCopy}>
                    <strong>
                      {tokenTransactionReasonLabels[
                        transaction.reason as keyof typeof tokenTransactionReasonLabels
                      ] ?? transaction.reason}
                    </strong>
                    <p>
                      {transaction.note ?? "Movimento registrado no saldo."} -{" "}
                      {formatDate(transaction.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`${styles.historyAmount} ${
                      transaction.type === "credit" ? styles.credit : styles.debit
                    }`}
                  >
                    {transaction.type === "credit" ? "+" : "-"}
                    {transaction.amount}
                  </span>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.emptyCard}>
              <strong>Ainda sem historico.</strong>
              <p>Os proximos creditos e debitos entram aqui.</p>
            </div>
          )}
        </section>

        <section className={styles.historyCard}>
          <div className={styles.historyHeader}>
            <div>
              <strong>Pagamentos recentes</strong>
              <span>Pix de pacotes e status do plano Pro.</span>
            </div>
          </div>

          {payments.length ? (
            <div className={styles.paymentList}>
              {payments.map((payment) => (
                <article key={payment.id} className={styles.paymentRow}>
                  <div className={styles.paymentCopy}>
                    <strong>{getPaymentTitle(payment, proPlan.monthlyTokenGrant)}</strong>
                    <p>{getPaymentCopy(payment, proPlan.monthlyTokenGrant)}</p>
                  </div>
                  <span className={styles.paymentAmount}>
                    {moneyFormatter.format(payment.amountCents / 100)}
                  </span>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.emptyCard}>
              <strong>Nenhum pagamento recente.</strong>
              <p>Quando tu comprar um pacote ou ativar o Pro, aparece aqui.</p>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
