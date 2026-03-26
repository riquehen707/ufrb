export const TOKEN_PACKAGES = {
  starter: {
    code: "starter",
    label: "5 tokens",
    amountCents: 490,
    tokenAmount: 5,
  },
  boost: {
    code: "boost",
    label: "15 tokens",
    amountCents: 990,
    tokenAmount: 15,
  },
  power: {
    code: "power",
    label: "40 tokens",
    amountCents: 1990,
    tokenAmount: 40,
  },
} as const;

export type TokenPackageCode = keyof typeof TOKEN_PACKAGES;
export type TokenPackage = (typeof TOKEN_PACKAGES)[TokenPackageCode];

export function isTokenPackageCode(value: string): value is TokenPackageCode {
  return value in TOKEN_PACKAGES;
}

export function getTokenPackage(code: TokenPackageCode): TokenPackage {
  return TOKEN_PACKAGES[code];
}
