export type HousingListingKind =
  | "republica_spot"
  | "private_room"
  | "shared_room"
  | "apartment"
  | "house";

export type HousingGenderPreference = "any" | "women" | "men" | "mixed";

export type HousingObligation =
  | "cleaning_scale"
  | "quiet_hours"
  | "bills_on_time"
  | "no_smoking"
  | "visits_agreed"
  | "respect_shared_spaces";

export type HousingDetails = {
  listingKind: HousingListingKind;
  totalRent?: number;
  splitRent?: number;
  availableSlots?: number;
  totalResidents?: number;
  bedrooms?: number;
  bathrooms?: number;
  garageSpots?: number;
  furnished?: boolean;
  acceptsPets?: boolean;
  internetIncluded?: boolean;
  waterIncluded?: boolean;
  electricityIncluded?: boolean;
  genderPreference?: HousingGenderPreference;
  paymentDay?: number;
  availableFrom?: string;
  obligations: HousingObligation[];
};

export const housingListingKindLabels: Record<HousingListingKind, string> = {
  republica_spot: "Vaga em republica",
  private_room: "Quarto individual",
  shared_room: "Quarto compartilhado",
  apartment: "Apartamento inteiro",
  house: "Casa",
};

export const housingGenderPreferenceLabels: Record<HousingGenderPreference, string> = {
  any: "Todos os generos",
  women: "Somente mulheres",
  men: "Somente homens",
  mixed: "Ambiente misto",
};

export const housingObligationLabels: Record<HousingObligation, string> = {
  cleaning_scale: "Limpeza em escala",
  quiet_hours: "Silencio a noite",
  bills_on_time: "Contas em dia",
  no_smoking: "Sem fumar dentro",
  visits_agreed: "Visitas combinadas",
  respect_shared_spaces: "Respeito aos espacos comuns",
};

export const housingObligationOptions = Object.entries(
  housingObligationLabels,
).map(([value, label]) => ({
  value: value as HousingObligation,
  label,
}));

export function isHousingCategory(category?: string | null) {
  return category === "Moradia";
}

export function hasHousingDetails(value?: HousingDetails | null) {
  return Boolean(value?.listingKind);
}

export function getHousingListingKindOptions() {
  return Object.entries(housingListingKindLabels).map(([value, label]) => ({
    value: value as HousingListingKind,
    label,
  }));
}

export function getHousingGenderOptions() {
  return Object.entries(housingGenderPreferenceLabels).map(([value, label]) => ({
    value: value as HousingGenderPreference,
    label,
  }));
}

export function getHousingPaymentLabel(day?: number | null) {
  if (!day || Number.isNaN(day)) {
    return "A combinar";
  }

  return `Dia ${day}`;
}

export function getHousingGenderLabel(value: HousingGenderPreference) {
  return housingGenderPreferenceLabels[value];
}

export function formatHousingAvailableFrom(value?: string | null) {
  if (!value) {
    return "Entrada flexivel";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

export function getHousingObligationText(obligations?: HousingObligation[]) {
  if (!obligations?.length) {
    return [];
  }

  return obligations.map((item) => housingObligationLabels[item]);
}

export function getHousingIncludedItems(details?: HousingDetails | null) {
  if (!details) {
    return [];
  }

  const items = [
    details.internetIncluded ? "Internet" : null,
    details.waterIncluded ? "Agua" : null,
    details.electricityIncluded ? "Energia" : null,
    details.furnished ? "Mobiliado" : null,
    details.acceptsPets ? "Pet friendly" : null,
    details.garageSpots ? `Garagem ${details.garageSpots}` : null,
  ].filter(Boolean);

  return items as string[];
}

export function normalizeHousingDetails(value: unknown): HousingDetails | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const source = value as Record<string, unknown>;
  const listingKind =
    typeof source.listingKind === "string" ? source.listingKind : null;

  if (!listingKind) {
    return undefined;
  }

  const obligations = Array.isArray(source.obligations)
    ? source.obligations.filter((item): item is HousingObligation =>
        typeof item === "string" && item in housingObligationLabels,
      )
    : [];

  return {
    listingKind: listingKind as HousingListingKind,
    totalRent:
      typeof source.totalRent === "number" ? source.totalRent : undefined,
    splitRent:
      typeof source.splitRent === "number" ? source.splitRent : undefined,
    availableSlots:
      typeof source.availableSlots === "number" ? source.availableSlots : undefined,
    totalResidents:
      typeof source.totalResidents === "number" ? source.totalResidents : undefined,
    bedrooms:
      typeof source.bedrooms === "number" ? source.bedrooms : undefined,
    bathrooms:
      typeof source.bathrooms === "number" ? source.bathrooms : undefined,
    garageSpots:
      typeof source.garageSpots === "number" ? source.garageSpots : undefined,
    furnished:
      typeof source.furnished === "boolean" ? source.furnished : undefined,
    acceptsPets:
      typeof source.acceptsPets === "boolean" ? source.acceptsPets : undefined,
    internetIncluded:
      typeof source.internetIncluded === "boolean"
        ? source.internetIncluded
        : undefined,
    waterIncluded:
      typeof source.waterIncluded === "boolean" ? source.waterIncluded : undefined,
    electricityIncluded:
      typeof source.electricityIncluded === "boolean"
        ? source.electricityIncluded
        : undefined,
    genderPreference:
      typeof source.genderPreference === "string"
        ? (source.genderPreference as HousingGenderPreference)
        : undefined,
    paymentDay:
      typeof source.paymentDay === "number" ? source.paymentDay : undefined,
    availableFrom:
      typeof source.availableFrom === "string" ? source.availableFrom : undefined,
    obligations,
  };
}
