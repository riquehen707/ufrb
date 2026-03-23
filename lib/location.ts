import type { Listing } from "@/lib/listings";

export function slugifyProfileId(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getListingProfileId(listing: Listing) {
  return listing.sellerId ?? slugifyProfileId(listing.sellerName);
}

export function getListingLocationPrimary(listing: Listing) {
  return listing.locationNote ?? listing.campus;
}

export function getListingLocationSecondary(listing: Listing) {
  if (!listing.locationNote) {
    return listing.deliveryMode;
  }

  const normalizedPrimary = listing.locationNote.toLowerCase();
  const normalizedCampus = listing.campus.toLowerCase();

  if (normalizedPrimary.includes(normalizedCampus)) {
    return listing.deliveryMode;
  }

  return listing.campus;
}

export function getListingLocationLine(listing: Listing) {
  const secondary = getListingLocationSecondary(listing);
  return secondary
    ? `${getListingLocationPrimary(listing)} - ${secondary}`
    : getListingLocationPrimary(listing);
}
