import type {
  PaymentStatus,
  SubscriptionStatus,
  TokenTransactionReason,
  TokenTransactionType,
} from "@/lib/monetization/types";

export const tokenTransactionReasonLabels: Record<TokenTransactionReason, string> = {
  initial_grant: "Tokens iniciais",
  monthly_grant_free: "Credito mensal Free",
  monthly_grant_pro: "Credito mensal Pro",
  token_package_purchase: "Compra de tokens",
  listing_create_simple: "Criacao de anuncio simples",
  listing_create_premium: "Criacao de anuncio premium",
  listing_renewal: "Renovacao de anuncio",
  listing_featured: "Destaque de anuncio",
  subscription_grant: "Credito do plano Pro",
  manual_adjustment: "Ajuste manual",
  refund: "Estorno",
};

export const tokenTransactionTypeLabels: Record<TokenTransactionType, string> = {
  credit: "Entrada",
  debit: "Saida",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: "Pendente",
  authorized: "Autorizado",
  paid: "Pago",
  failed: "Falhou",
  refunded: "Estornado",
  cancelled: "Cancelado",
};

export const subscriptionStatusLabels: Record<SubscriptionStatus, string> = {
  inactive: "Inativa",
  active: "Ativa",
  past_due: "Pagamento pendente",
  cancelled: "Cancelada",
};
