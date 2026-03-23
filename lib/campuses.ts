export const campusOptions = [
  "Cruz das Almas",
  "Amargosa",
  "Cachoeira",
  "Feira de Santana",
  "Santo Amaro",
  "Santo Antonio de Jesus",
] as const;

export const defaultCampus = campusOptions[0];

export type CampusName = (typeof campusOptions)[number];
