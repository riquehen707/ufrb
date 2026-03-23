import type { HousingDetails } from "@/lib/housing";
import { normalizeHousingDetails } from "@/lib/housing";
import type {
  ItemCondition,
  ListingIntent,
  ListingType,
  NegotiationMode,
} from "@/lib/listing-taxonomy";

export type Listing = {
  id: string;
  sellerId?: string;
  intent: ListingIntent;
  type: ListingType;
  category: string;
  focus?: string;
  itemCondition?: ItemCondition;
  negotiationMode: NegotiationMode;
  imageUrl?: string;
  galleryUrls?: string[];
  locationNote?: string;
  housingDetails?: HousingDetails;
  title: string;
  price: number;
  priceUnit?: string;
  campus: string;
  sellerName: string;
  sellerCourse: string;
  rating: number;
  deliveryMode: string;
  featured: boolean;
  description: string;
  tags: string[];
};

export type ListingRow = {
  id: string;
  owner_id: string | null;
  intent: ListingIntent | null;
  title: string;
  type: ListingType;
  category: string;
  focus: string | null;
  item_condition: ItemCondition | null;
  negotiation_mode: NegotiationMode | null;
  image_url: string | null;
  gallery_urls: string[] | null;
  location_note: string | null;
  housing_details: unknown | null;
  price: number | string;
  price_unit: string | null;
  campus: string | null;
  seller_name: string | null;
  seller_course: string | null;
  rating: number | string | null;
  delivery_mode: string | null;
  featured: boolean | null;
  description: string | null;
  tags: string[] | null;
};

export const listingSelect =
  "id, owner_id, intent, title, type, category, focus, item_condition, negotiation_mode, image_url, gallery_urls, location_note, housing_details, price, price_unit, campus, seller_name, seller_course, rating, delivery_mode, featured, description, tags";

export function normalizeListing(row: ListingRow): Listing {
  return {
    id: row.id,
    sellerId: row.owner_id ?? undefined,
    intent: row.intent ?? "offer",
    title: row.title,
    type: row.type,
    category: row.category,
    focus: row.focus ?? undefined,
    itemCondition:
      row.type === "product" ? (row.item_condition ?? "used") : undefined,
    negotiationMode: row.negotiation_mode ?? "fixed",
    imageUrl: row.image_url ?? undefined,
    galleryUrls: row.gallery_urls ?? undefined,
    locationNote: row.location_note ?? undefined,
    housingDetails: normalizeHousingDetails(row.housing_details),
    price: Number(row.price),
    priceUnit: row.price_unit ?? undefined,
    campus: row.campus ?? "Campus a combinar",
    sellerName: row.seller_name ?? "Perfil universitario",
    sellerCourse: row.seller_course ?? "Comunidade academica",
    rating: row.rating ? Number(row.rating) : 4.7,
    deliveryMode: row.delivery_mode ?? "Combinado pelo campus",
    featured: Boolean(row.featured),
    description:
      row.description ?? "Anuncio carregado do Supabase sem descricao detalhada.",
    tags: row.tags ?? [],
  };
}
