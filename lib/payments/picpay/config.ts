export const picPayClientId = process.env.PICPAY_CLIENT_ID;
export const picPayClientSecret = process.env.PICPAY_CLIENT_SECRET;
export const picPayWebhookToken = process.env.PICPAY_WEBHOOK_TOKEN;
export const picPayCheckoutBaseUrl =
  process.env.PICPAY_CHECKOUT_BASE_URL ?? "https://checkout-api.picpay.com";
export const picPayPixBaseUrl =
  process.env.PICPAY_PIX_BASE_URL ?? picPayCheckoutBaseUrl;
export const picPayAuthBaseUrl =
  process.env.PICPAY_AUTH_BASE_URL ?? picPayCheckoutBaseUrl;
export const picPayCallerOrigin = process.env.PICPAY_CALLER_ORIGIN ?? "campus";

export function isPicPayConfigured() {
  return Boolean(picPayClientId && picPayClientSecret);
}
