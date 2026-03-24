import type { Listing } from "@/lib/listings";

export type WorkTabId = "transporte" | "aulas" | "servicos";

export type WorkTab = {
  id: WorkTabId;
  label: string;
  title: string;
  description: string;
};

export type RoutePoint = {
  id: string;
  label: string;
  campus: string;
  lat: number;
  lng: number;
};

export type WorkListingStats = {
  total: number;
  offers: number;
  requests: number;
  focusCount: number;
  campusCount: number;
  averagePrice: number;
};

export const workTabs: WorkTab[] = [
  {
    id: "transporte",
    label: "Transporte",
    title: "Transporte comunitario",
    description: "Rotas, pedidos e estimativas para dividir deslocamentos.",
  },
  {
    id: "aulas",
    label: "Aulas",
    title: "Aulas e ajuda academica",
    description: "Quem pode ensinar, quem esta buscando ajuda e como fechar grupos.",
  },
  {
    id: "servicos",
    label: "Servicos",
    title: "Servicos gerais",
    description: "Demandas da casa, pequenos corres e prestadores reais do campus.",
  },
];

export const routePoints: RoutePoint[] = [
  {
    id: "ufrb-cruz",
    label: "Campus UFRB - Cruz das Almas",
    campus: "Cruz das Almas",
    lat: -12.6718,
    lng: -39.1014,
  },
  {
    id: "rodoviaria-cruz",
    label: "Rodoviaria de Cruz das Almas",
    campus: "Cruz das Almas",
    lat: -12.6701,
    lng: -39.1107,
  },
  {
    id: "centro-cruz",
    label: "Centro de Cruz das Almas",
    campus: "Cruz das Almas",
    lat: -12.6679,
    lng: -39.1012,
  },
  {
    id: "bairro-coplan",
    label: "Bairro Coplan",
    campus: "Cruz das Almas",
    lat: -12.6763,
    lng: -39.0956,
  },
  {
    id: "saj-centro",
    label: "Centro de Santo Antonio de Jesus",
    campus: "Santo Antonio de Jesus",
    lat: -12.968,
    lng: -39.2618,
  },
];

function normalizeValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function matchesCategory(listing: Listing, expectedCategory: string) {
  return normalizeValue(listing.category) === normalizeValue(expectedCategory);
}

export function bucketWorkListings(listings: Listing[]) {
  return {
    aulas: listings.filter((listing) => matchesCategory(listing, "Aulas e monitoria")),
    transporte: listings.filter((listing) =>
      matchesCategory(listing, "Transporte comunitario"),
    ),
    servicos: listings.filter((listing) =>
      matchesCategory(listing, "Servicos gerais"),
    ),
  };
}

export function getWorkListingStats(listings: Listing[]): WorkListingStats {
  const offers = listings.filter((listing) => listing.intent === "offer");
  const requests = listings.filter((listing) => listing.intent === "request");
  const campusCount = new Set(listings.map((listing) => listing.campus)).size;
  const focusCount = new Set(
    listings.map((listing) => listing.focus).filter(Boolean),
  ).size;
  const averagePrice = listings.length
    ? listings.reduce((total, listing) => total + listing.price, 0) / listings.length
    : 0;

  return {
    total: listings.length,
    offers: offers.length,
    requests: requests.length,
    focusCount,
    campusCount,
    averagePrice,
  };
}

export function getTopWorkFocuses(listings: Listing[], limit = 6) {
  const counter = new Map<string, number>();

  for (const listing of listings) {
    if (!listing.focus) {
      continue;
    }

    counter.set(listing.focus, (counter.get(listing.focus) ?? 0) + 1);
  }

  return Array.from(counter.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([focus]) => focus);
}

export function getWorkTab(tabId: WorkTabId) {
  return workTabs.find((tab) => tab.id === tabId) ?? workTabs[0];
}

export function normalizeWorkTab(tab?: string | null): WorkTabId {
  if (tab === "aulas" || tab === "servicos" || tab === "transporte") {
    return tab;
  }

  return "transporte";
}

export function getRoutePointById(pointId: string) {
  return routePoints.find((point) => point.id === pointId) ?? routePoints[0];
}

export function haversineDistanceKm(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
) {
  const earthRadiusKm = 6371;
  const dLat = degreesToRadians(destination.lat - origin.lat);
  const dLng = degreesToRadians(destination.lng - origin.lng);
  const lat1 = degreesToRadians(origin.lat);
  const lat2 = degreesToRadians(destination.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) *
      Math.sin(dLng / 2) *
      Math.cos(lat1) *
      Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

export function estimateTransport(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  ridersCount: number,
) {
  const distanceKm = haversineDistanceKm(origin, destination);
  const estimatedDistanceKm = Math.max(1.2, Number(distanceKm.toFixed(1)));
  const totalFare = Number((6 + estimatedDistanceKm * 3.2).toFixed(2));
  const splitFare = Number((totalFare / Math.max(1, ridersCount)).toFixed(2));
  const durationMinutes = Math.max(8, Math.round(estimatedDistanceKm * 4.5));

  return {
    distanceKm: estimatedDistanceKm,
    totalFare,
    splitFare,
    durationMinutes,
  };
}

export function getListingLocationLabel(listing: Listing) {
  return listing.locationNote ?? listing.campus;
}

export function formatWorkListingPrice(listing: Listing) {
  const value = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(listing.price);

  return listing.priceUnit ? `${value} / ${listing.priceUnit}` : value;
}

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180;
}
