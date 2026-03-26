export type PicPayPhone = {
  countryCode: string;
  areaCode: string;
  number: string;
  type?: "MOBILE" | "RESIDENTIAL" | "COMMERCIAL";
};

export type PicPayCustomer = {
  name: string;
  email: string;
  document: string;
  documentType?: "CPF" | "CNPJ";
  phone: PicPayPhone;
};

export type PicPayAuthTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  message?: string;
  errors?: unknown;
};

export type PicPayChargeResponse = {
  id?: string;
  merchantChargeId?: string;
  chargeStatus?: string;
  amount?: number;
  originalAmount?: number;
  refundedAmount?: number;
  transactions?: Array<{
    paymentType?: "PIX" | "CREDIT" | "WALLET";
    transactionId?: string;
    transactionStatus?: string;
    amount?: number;
    originalAmount?: number;
    refundedAmount?: number;
    createdAt?: string;
    updatedAt?: string;
    pix?: {
      qrCode?: string;
      qrCodeBase64?: string;
      endToEndId?: string;
      expiresAt?: string;
    };
    wallet?: {
      qrCode?: string;
      qrCodeBase64?: string;
      expiresAt?: string;
    };
  }>;
  message?: string;
  success?: boolean;
  errors?: Array<{ message?: string; field?: string }> | unknown;
};

export type PicPayPixChargeResult = {
  chargeId: string;
  merchantChargeId: string;
  chargeStatus: string;
  transactionId?: string;
  transactionStatus?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  endToEndId?: string;
  expiresAt?: string;
  raw: PicPayChargeResponse;
};

export type PicPayWebhookEvent = {
  id?: string;
  type?: string;
  eventDate?: string;
  merchantCode?: string;
  merchantDocument?: string;
  data?: {
    status?: string;
    amount?: number;
    originalAmount?: number;
    refundedAmount?: number;
    customer?: {
      document?: string;
      documentType?: string;
      email?: string;
      name?: string;
    };
    merchantChargeId?: string;
    chargeId?: string;
    paymentSource?: string;
    transactions?: Array<{
      paymentType?: "PIX" | "CREDIT" | "WALLET";
      transactionId?: string;
      status?: string;
      amount?: number;
      originalAmount?: number;
      refundedAmount?: number;
      createdAt?: string;
      updatedAt?: string;
      pix?: {
        qrCode?: string;
        qrCodeBase64?: string;
        endToEndId?: string;
        expiresAt?: string;
      };
      wallet?: {
        qrCode?: string;
        qrCodeBase64?: string;
        expiresAt?: string;
      };
    }>;
  };
};
