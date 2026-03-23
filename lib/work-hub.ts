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

export type TransportGroup = {
  id: string;
  title: string;
  routeLabel: string;
  departureTime: string;
  seatsFilled: number;
  seatTotal: number;
  totalFare: number;
  splitFare: number;
  distanceKm: number;
};

export type TeacherProfile = {
  id: string;
  name: string;
  campus: string;
  headline: string;
  rating: number;
  reliability: number;
  specialties: string[];
  actions: string[];
};

export type ClassDemand = {
  id: string;
  title: string;
  audience: string;
  format: string;
  location: string;
  budget: number;
  studentsWaiting: number;
  timing: string;
};

export type StudyGroup = {
  id: string;
  title: string;
  audience: string;
  openSlots: number;
  totalSlots: number;
  location: string;
  timing: string;
  perStudent: number;
};

export type GeneralServiceRequest = {
  id: string;
  title: string;
  category: string;
  place: string;
  budget: number;
  urgency: string;
  note: string;
};

export const workTabs: WorkTab[] = [
  {
    id: "transporte",
    label: "Transporte",
    title: "Transporte comunitario",
    description: "Rotas, rateio e horarios.",
  },
  {
    id: "aulas",
    label: "Aulas",
    title: "Aulas e monitoria",
    description: "Professores, grupos e demandas.",
  },
  {
    id: "servicos",
    label: "Servicos gerais",
    title: "Servicos gerais",
    description: "Pedidos da casa com escopo claro.",
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

export const transportGroups: TransportGroup[] = [
  {
    id: "grp-manha",
    title: "Saida da rodoviaria para o campus",
    routeLabel: "Rodoviaria -> UFRB Cruz das Almas",
    departureTime: "07:10",
    seatsFilled: 3,
    seatTotal: 5,
    totalFare: 28,
    splitFare: 9.33,
    distanceKm: 3.4,
  },
  {
    id: "grp-almoco",
    title: "Campus para o centro depois da aula",
    routeLabel: "UFRB Cruz das Almas -> Centro",
    departureTime: "12:25",
    seatsFilled: 2,
    seatTotal: 4,
    totalFare: 18,
    splitFare: 9,
    distanceKm: 2.1,
  },
  {
    id: "grp-noite",
    title: "Volta para bairros e republicas",
    routeLabel: "UFRB Cruz das Almas -> Coplan",
    departureTime: "18:40",
    seatsFilled: 4,
    seatTotal: 5,
    totalFare: 24,
    splitFare: 6,
    distanceKm: 2.8,
  },
];

export const teacherProfiles: TeacherProfile[] = [
  {
    id: "prof-calculo",
    name: "Ana Beatriz",
    campus: "Cruz das Almas",
    headline: "Calculo, algebra linear e revisao para prova",
    rating: 4.9,
    reliability: 4.8,
    specialties: [
      "Particular - Universitario",
      "Grupo - Universitario",
      "Banca",
    ],
    actions: ["Agendar aula particular", "Abrir turma"],
  },
  {
    id: "prof-quimica",
    name: "Rafael Nunes",
    campus: "Amargosa",
    headline: "Quimica e fisica para ensino medio e vestibular",
    rating: 4.7,
    reliability: 4.9,
    specialties: [
      "Particular - Ensino medio",
      "Grupo - Ensino medio",
    ],
    actions: ["Responder demanda", "Montar grupo"],
  },
  {
    id: "prof-ingles",
    name: "Livia Souza",
    campus: "Feira de Santana",
    headline: "Ingles academico e conversacao para intercambio",
    rating: 4.8,
    reliability: 4.7,
    specialties: ["Particular - Universitario", "Grupo - Universitario"],
    actions: ["Agendar aula", "Ver demandas abertas"],
  },
];

export const classDemands: ClassDemand[] = [
  {
    id: "dmd-fisica",
    title: "Procuro professor para Fisica I",
    audience: "Universitario",
    format: "Particular",
    location: "Biblioteca de Cruz das Almas",
    budget: 45,
    studentsWaiting: 1,
    timing: "Seg e Qua - 18:30",
  },
  {
    id: "dmd-redacao",
    title: "Grupo de redacao para ensino medio",
    audience: "Ensino medio",
    format: "Grupo",
    location: "Online ou centro da cidade",
    budget: 28,
    studentsWaiting: 4,
    timing: "Sab - 09:00",
  },
  {
    id: "dmd-calculo",
    title: "Reforco intensivo pre-prova de Calculo",
    audience: "Universitario",
    format: "Grupo",
    location: "Pavilhao de aulas",
    budget: 25,
    studentsWaiting: 3,
    timing: "Ter - 19:10",
  },
];

export const studyGroups: StudyGroup[] = [
  {
    id: "grp-bio",
    title: "Turma aberta de Bioquimica",
    audience: "Universitario",
    openSlots: 2,
    totalSlots: 6,
    location: "Sala combinada no campus",
    timing: "Qui - 17:30",
    perStudent: 22,
  },
  {
    id: "grp-mat",
    title: "Grupo de matematica para ensino medio",
    audience: "Ensino medio",
    openSlots: 4,
    totalSlots: 8,
    location: "Online",
    timing: "Sab - 14:00",
    perStudent: 18,
  },
];

export const generalServiceRequests: GeneralServiceRequest[] = [
  {
    id: "srv-tela",
    title: "Instalar tela de protecao em duas janelas",
    category: "Pequenos reparos",
    place: "Republica perto do campus",
    budget: 140,
    urgency: "Essa semana",
    note: "Ja tenho as telas, preciso da instalacao e acabamento.",
  },
  {
    id: "srv-faxina",
    title: "Faxina pesada depois da mudanca",
    category: "Faxina",
    place: "Apartamento estudantil",
    budget: 95,
    urgency: "Fim de semana",
    note: "Cozinha, banheiro e organizacao geral.",
  },
  {
    id: "srv-montagem",
    title: "Montar guarda-roupa e bancada de estudos",
    category: "Montagem",
    place: "Quarto em republica",
    budget: 120,
    urgency: "Hoje a noite",
    note: "Movel simples com manual e parafusos completos.",
  },
];

export function normalizeWorkTab(tab?: string | null): WorkTabId {
  if (tab === "aulas" || tab === "servicos" || tab === "transporte") {
    return tab;
  }

  return "transporte";
}

export function getWorkTab(tabId: WorkTabId) {
  return workTabs.find((tab) => tab.id === tabId) ?? workTabs[0];
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

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180;
}
