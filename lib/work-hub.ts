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
  driverLabel: string;
  originPointId: string;
  destinationPointId: string;
  departureTime: string;
  seatsFilled: number;
  seatTotal: number;
  totalFare: number;
  splitFare: number;
  distanceKm: number;
  enrollments: TransportEnrollment[];
};

export type TransportEnrollment = {
  id: string;
  riderName: string;
  pickupPointId: string;
  seatCount: number;
};

export type TransportRouteStop = {
  pointId: string;
  label: string;
  pickupCount: number;
  riderNames: string[];
  distanceFromPreviousKm: number;
  cumulativeDistanceKm: number;
};

export type TransportRoutePlan = {
  startLabel: string;
  endLabel: string;
  pickupCount: number;
  stopCount: number;
  totalDistanceKm: number;
  totalFare: number;
  splitFare: number;
  durationMinutes: number;
  finalLegDistanceKm: number;
  stops: TransportRouteStop[];
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
    driverLabel: "Pedro Henrique",
    originPointId: "rodoviaria-cruz",
    destinationPointId: "ufrb-cruz",
    departureTime: "07:10",
    seatsFilled: 3,
    seatTotal: 5,
    totalFare: 28,
    splitFare: 9.33,
    distanceKm: 3.4,
    enrollments: [
      {
        id: "grp-manha-joana",
        riderName: "Joana",
        pickupPointId: "rodoviaria-cruz",
        seatCount: 1,
      },
      {
        id: "grp-manha-caio",
        riderName: "Caio",
        pickupPointId: "centro-cruz",
        seatCount: 1,
      },
      {
        id: "grp-manha-mari",
        riderName: "Mari",
        pickupPointId: "bairro-coplan",
        seatCount: 1,
      },
    ],
  },
  {
    id: "grp-almoco",
    title: "Campus para o centro depois da aula",
    routeLabel: "UFRB Cruz das Almas -> Centro",
    driverLabel: "Talita Souza",
    originPointId: "ufrb-cruz",
    destinationPointId: "centro-cruz",
    departureTime: "12:25",
    seatsFilled: 2,
    seatTotal: 4,
    totalFare: 18,
    splitFare: 9,
    distanceKm: 2.1,
    enrollments: [
      {
        id: "grp-almoco-lia",
        riderName: "Lia",
        pickupPointId: "ufrb-cruz",
        seatCount: 1,
      },
      {
        id: "grp-almoco-davi",
        riderName: "Davi",
        pickupPointId: "bairro-coplan",
        seatCount: 1,
      },
    ],
  },
  {
    id: "grp-noite",
    title: "Volta para bairros e republicas",
    routeLabel: "UFRB Cruz das Almas -> Coplan",
    driverLabel: "Iago Menezes",
    originPointId: "ufrb-cruz",
    destinationPointId: "bairro-coplan",
    departureTime: "18:40",
    seatsFilled: 4,
    seatTotal: 5,
    totalFare: 24,
    splitFare: 6,
    distanceKm: 2.8,
    enrollments: [
      {
        id: "grp-noite-iris",
        riderName: "Iris",
        pickupPointId: "ufrb-cruz",
        seatCount: 1,
      },
      {
        id: "grp-noite-noah",
        riderName: "Noah",
        pickupPointId: "centro-cruz",
        seatCount: 1,
      },
      {
        id: "grp-noite-teo",
        riderName: "Teo",
        pickupPointId: "rodoviaria-cruz",
        seatCount: 1,
      },
      {
        id: "grp-noite-bia",
        riderName: "Bia",
        pickupPointId: "bairro-coplan",
        seatCount: 1,
      },
    ],
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

export function getRoutePointById(pointId: string) {
  return routePoints.find((point) => point.id === pointId) ?? routePoints[0];
}

export function getTransportGroupById(groupId: string) {
  return transportGroups.find((group) => group.id === groupId) ?? transportGroups[0];
}

export function buildTransportRoutePlan(
  group: TransportGroup,
  options?: {
    customStart?: {
      lat: number;
      lng: number;
      label: string;
    } | null;
    customDestinationId?: string;
  },
): TransportRoutePlan {
  const originPoint = getRoutePointById(group.originPointId);
  const destinationPoint = getRoutePointById(
    options?.customDestinationId ?? group.destinationPointId,
  );
  const startPoint = options?.customStart ?? originPoint;
  const pickupMap = new Map<
    string,
    {
      point: RoutePoint;
      pickupCount: number;
      riderNames: string[];
    }
  >();

  group.enrollments.forEach((enrollment) => {
    const point = getRoutePointById(enrollment.pickupPointId);
    const existing = pickupMap.get(point.id);

    if (existing) {
      existing.pickupCount += enrollment.seatCount;
      existing.riderNames.push(enrollment.riderName);
      return;
    }

    pickupMap.set(point.id, {
      point,
      pickupCount: enrollment.seatCount,
      riderNames: [enrollment.riderName],
    });
  });

  const remainingStops = Array.from(pickupMap.values());
  const orderedStops: TransportRouteStop[] = [];
  let currentPoint = startPoint;
  let cumulativeDistanceKm = 0;

  while (remainingStops.length) {
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    remainingStops.forEach((candidate, index) => {
      const distance = haversineDistanceKm(currentPoint, candidate.point);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    const [nextStop] = remainingStops.splice(nearestIndex, 1);
    const segmentDistance = Math.max(0, Number(nearestDistance.toFixed(1)));
    cumulativeDistanceKm += segmentDistance;

    orderedStops.push({
      pointId: nextStop.point.id,
      label: nextStop.point.label,
      pickupCount: nextStop.pickupCount,
      riderNames: nextStop.riderNames,
      distanceFromPreviousKm: segmentDistance,
      cumulativeDistanceKm: Number(cumulativeDistanceKm.toFixed(1)),
    });

    currentPoint = nextStop.point;
  }

  const finalLegDistanceKm = Number(
    haversineDistanceKm(currentPoint, destinationPoint).toFixed(1),
  );
  const totalDistanceKm = Number((cumulativeDistanceKm + finalLegDistanceKm).toFixed(1));
  const pickupCount = group.enrollments.reduce(
    (total, enrollment) => total + enrollment.seatCount,
    0,
  );
  const totalFare = Number(
    (6 + totalDistanceKm * 3.2 + orderedStops.length * 1.4).toFixed(2),
  );
  const splitFare = Number(
    (totalFare / Math.max(1, pickupCount)).toFixed(2),
  );
  const durationMinutes = Math.max(
    10,
    Math.round(totalDistanceKm * 4.6 + orderedStops.length * 3),
  );

  return {
    startLabel: startPoint.label,
    endLabel: destinationPoint.label,
    pickupCount,
    stopCount: orderedStops.length,
    totalDistanceKm,
    totalFare,
    splitFare,
    durationMinutes,
    finalLegDistanceKm,
    stops: orderedStops,
  };
}

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180;
}
