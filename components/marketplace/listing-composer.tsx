"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  ArrowRight,
  Camera,
  ImageIcon,
  ImagePlus,
  MapPin,
  Sparkles,
  X,
} from "lucide-react";

import { campusOptions, defaultCampus } from "@/lib/campuses";
import {
  getCategoriesForType,
  getFocusOptions,
  itemConditionLabels,
  listingIntentLabels,
  listingTypeLabels,
  negotiationModeHints,
  negotiationModeLabels,
  type ItemCondition,
  type ListingIntent,
  type ListingType,
  type NegotiationMode,
} from "@/lib/listing-taxonomy";
import {
  getHousingGenderOptions,
  getHousingIncludedItems,
  getHousingListingKindOptions,
  getHousingObligationText,
  getHousingPaymentLabel,
  housingGenderPreferenceLabels,
  housingListingKindLabels,
  housingObligationOptions,
  isHousingCategory,
  type HousingDetails,
  type HousingGenderPreference,
  type HousingListingKind,
  type HousingObligation,
} from "@/lib/housing";
import { readPermissionState, type AppPermissionState } from "@/lib/permissions";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isSupabaseConfigured, listingMediaBucket } from "@/lib/supabase/env";

type HousingDraft = {
  listingKind: HousingListingKind;
  totalRent: string;
  availableSlots: string;
  totalResidents: string;
  bedrooms: string;
  bathrooms: string;
  garageSpots: string;
  furnished: boolean;
  acceptsPets: boolean;
  internetIncluded: boolean;
  waterIncluded: boolean;
  electricityIncluded: boolean;
  genderPreference: HousingGenderPreference;
  paymentDay: string;
  availableFrom: string;
  obligations: HousingObligation[];
};

type Draft = {
  intent: ListingIntent;
  type: ListingType;
  category: string;
  focus: string;
  itemCondition: ItemCondition;
  negotiationMode: NegotiationMode;
  title: string;
  price: string;
  priceUnit: string;
  campus: string;
  sellerCourse: string;
  deliveryMode: string;
  description: string;
  locationNote: string;
  locationLat: number | null;
  locationLng: number | null;
  housing: HousingDraft;
};

type MessageState =
  | {
      tone: "info" | "success" | "error";
      text: string;
    }
  | null;

type Props = {
  initialIntent?: ListingIntent;
  initialType?: ListingType;
  initialCategory?: string;
};

function createInitialHousingDraft(): HousingDraft {
  return {
    listingKind: "republica_spot",
    totalRent: "",
    availableSlots: "1",
    totalResidents: "",
    bedrooms: "",
    bathrooms: "",
    garageSpots: "",
    furnished: true,
    acceptsPets: false,
    internetIncluded: true,
    waterIncluded: true,
    electricityIncluded: false,
    genderPreference: "any",
    paymentDay: "5",
    availableFrom: "",
    obligations: ["cleaning_scale", "bills_on_time"],
  };
}

function getDefaultCategory(type: ListingType, initialCategory?: string) {
  const categories = getCategoriesForType(type);

  if (initialCategory && categories.includes(initialCategory)) {
    return initialCategory;
  }

  return categories[0];
}

function getDefaultPriceUnit(type: ListingType, category: string) {
  if (type === "service") {
    return "hora";
  }

  if (isHousingCategory(category)) {
    return "mes";
  }

  return "";
}

function getDefaultDeliveryMode(
  intent: ListingIntent,
  type: ListingType,
  category: string,
) {
  if (isHousingCategory(category)) {
    return intent === "request"
      ? "Procuro visita e entrada organizada"
      : "Visita combinada e entrada a partir da data informada";
  }

  if (type === "service") {
    return "Presencial, online ou hibrido";
  }

  return intent === "request"
    ? "Posso retirar ou combinar entrega"
    : "Retirada combinada";
}

function getDefaultNegotiationMode(intent: ListingIntent): NegotiationMode {
  return intent === "request" ? "negotiable" : "fixed";
}

function createInitialDraft(
  initialIntent: ListingIntent = "offer",
  initialType: ListingType = "service",
  initialCategory?: string,
): Draft {
  const category = getDefaultCategory(initialType, initialCategory);

  return {
    intent: initialIntent,
    type: initialType,
    category,
    focus: getFocusOptions(category)[0] ?? "",
    itemCondition: "used",
    negotiationMode: getDefaultNegotiationMode(initialIntent),
    title: "",
    price: "",
    priceUnit: getDefaultPriceUnit(initialType, category),
    campus: defaultCampus,
    sellerCourse: "",
    deliveryMode: getDefaultDeliveryMode(initialIntent, initialType, category),
    description: "",
    locationNote: "",
    locationLat: null,
    locationLng: null,
    housing: createInitialHousingDraft(),
  };
}

const initialDraft = createInitialDraft();

function parseOptionalNumber(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function serializeHousingDetails(draft: Draft): HousingDetails | null {
  if (!isHousingCategory(draft.category)) {
    return null;
  }

  return {
    listingKind: draft.housing.listingKind,
    totalRent: parseOptionalNumber(draft.housing.totalRent),
    splitRent: parseOptionalNumber(draft.price),
    availableSlots: parseOptionalNumber(draft.housing.availableSlots),
    totalResidents: parseOptionalNumber(draft.housing.totalResidents),
    bedrooms: parseOptionalNumber(draft.housing.bedrooms),
    bathrooms: parseOptionalNumber(draft.housing.bathrooms),
    garageSpots: parseOptionalNumber(draft.housing.garageSpots),
    furnished: draft.housing.furnished,
    acceptsPets: draft.housing.acceptsPets,
    internetIncluded: draft.housing.internetIncluded,
    waterIncluded: draft.housing.waterIncluded,
    electricityIncluded: draft.housing.electricityIncluded,
    genderPreference: draft.housing.genderPreference,
    paymentDay: parseOptionalNumber(draft.housing.paymentDay),
    availableFrom: draft.housing.availableFrom || undefined,
    obligations: draft.housing.obligations,
  };
}

function getPriceHeadline(draft: Draft) {
  if (!draft.price) {
    return draft.intent === "request" ? "Define um orcamento" : "Define um preco";
  }

  const unit = draft.priceUnit ? ` / ${draft.priceUnit}` : "";
  return draft.intent === "request"
    ? `Ate R$ ${draft.price}${unit}`
    : `R$ ${draft.price}${unit}`;
}

function getFocusLabel(category: string) {
  if (category === "Livros") {
    return "Tema";
  }

  if (category === "Aulas e monitoria") {
    return "Formato e nivel";
  }

  if (category === "Transporte comunitario") {
    return "Rota ou recorte";
  }

  if (category === "Moradia") {
    return "Formato de moradia";
  }

  return "Recorte";
}

function buildAutoTags(draft: Draft) {
  const housingDetails = serializeHousingDetails(draft);

  return Array.from(
    new Set(
      [
        draft.category.toLowerCase(),
        draft.focus.toLowerCase(),
        listingIntentLabels[draft.intent].toLowerCase(),
        listingTypeLabels[draft.type].toLowerCase(),
        draft.type === "product"
          ? itemConditionLabels[draft.itemCondition].toLowerCase()
          : null,
        housingDetails
          ? housingGenderPreferenceLabels[
              housingDetails.genderPreference ?? "any"
            ].toLowerCase()
          : null,
        ...(housingDetails
          ? getHousingObligationText(housingDetails.obligations).map((item) =>
              item.toLowerCase(),
            )
          : []),
      ].filter(Boolean),
    ),
  );
}

export function ListingComposer({
  initialIntent = "offer",
  initialType = "service",
  initialCategory,
}: Props) {
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const [draft, setDraft] = useState<Draft>(() =>
    createInitialDraft(initialIntent, initialType, initialCategory),
  );
  const [message, setMessage] = useState<MessageState>(null);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [selectedImagePreviews, setSelectedImagePreviews] = useState<string[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [cameraPermission, setCameraPermission] =
    useState<AppPermissionState>("unsupported");
  const [locationPermission, setLocationPermission] =
    useState<AppPermissionState>("unsupported");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    let isMounted = true;

    void supabase.auth.getUser().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      const user = data.user;
      setSessionEmail(user?.email ?? null);
      setDraft((current) => ({
        ...current,
        campus: user?.user_metadata?.campus ?? current.campus ?? initialDraft.campus,
      }));
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      selectedImagePreviews.forEach((preview) => {
        if (preview.startsWith("blob:")) {
          URL.revokeObjectURL(preview);
        }
      });
    };
  }, [selectedImagePreviews]);

  useEffect(() => {
    let isMounted = true;

    void Promise.all([
      readPermissionState("camera"),
      readPermissionState("geolocation"),
    ]).then(([cameraState, geolocationState]) => {
      if (!isMounted) {
        return;
      }

      setCameraPermission(cameraState);
      setLocationPermission(geolocationState);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const categories = getCategoriesForType(draft.type);
  const focusOptions = getFocusOptions(draft.category);
  const housingDetails = serializeHousingDetails(draft);
  const housingIncludedItems = getHousingIncludedItems(housingDetails);
  function updateField<K extends keyof Draft>(field: K, value: Draft[K]) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateHousingField<K extends keyof HousingDraft>(
    field: K,
    value: HousingDraft[K],
  ) {
    setDraft((current) => ({
      ...current,
      housing: {
        ...current.housing,
        [field]: value,
      },
    }));
  }

  function toggleHousingObligation(obligation: HousingObligation) {
    setDraft((current) => {
      const nextObligations = current.housing.obligations.includes(obligation)
        ? current.housing.obligations.filter((item) => item !== obligation)
        : [...current.housing.obligations, obligation];

      return {
        ...current,
        housing: {
          ...current.housing,
          obligations: nextObligations,
        },
      };
    });
  }

  function changeIntent(nextIntent: ListingIntent) {
    setDraft((current) => ({
      ...current,
      intent: nextIntent,
      negotiationMode: getDefaultNegotiationMode(nextIntent),
      deliveryMode: getDefaultDeliveryMode(nextIntent, current.type, current.category),
    }));
  }

  function changeType(nextType: ListingType) {
    const nextCategory = getDefaultCategory(nextType);

    setDraft((current) => ({
      ...current,
      type: nextType,
      category: nextCategory,
      focus: getFocusOptions(nextCategory)[0] ?? "",
      itemCondition: "used",
      priceUnit: getDefaultPriceUnit(nextType, nextCategory),
      deliveryMode: getDefaultDeliveryMode(current.intent, nextType, nextCategory),
    }));
  }

  function changeCategory(nextCategory: string) {
    setDraft((current) => ({
      ...current,
      category: nextCategory,
      focus: getFocusOptions(nextCategory)[0] ?? "",
      priceUnit: getDefaultPriceUnit(current.type, nextCategory),
      deliveryMode: getDefaultDeliveryMode(current.intent, current.type, nextCategory),
    }));
  }

  function replaceSelectedImages(files: File[]) {
    selectedImagePreviews.forEach((preview) => {
      if (preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    });

    const nextFiles = files.slice(0, 4);
    setSelectedImageFiles(nextFiles);
    setSelectedImagePreviews(nextFiles.map((file) => URL.createObjectURL(file)));
  }

  function removeSelectedImages() {
    selectedImagePreviews.forEach((preview) => {
      if (preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    });

    setSelectedImageFiles([]);
    setSelectedImagePreviews([]);

    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }

    if (galleryInputRef.current) {
      galleryInputRef.current.value = "";
    }
  }

  async function requestCameraCapture() {
    setMessage(null);

    const currentPermission = await readPermissionState("camera");
    setCameraPermission(currentPermission);

    if (currentPermission === "denied") {
      setMessage({
        tone: "error",
        text: "Libera a camera no navegador para tirar foto por aqui.",
      });
      return;
    }

    if (
      "mediaDevices" in navigator &&
      typeof navigator.mediaDevices?.getUserMedia === "function"
    ) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
          },
        });

        stream.getTracks().forEach((track) => track.stop());
        setCameraPermission("granted");
      } catch {
        const nextPermission = await readPermissionState("camera");
        setCameraPermission(nextPermission);

        if (nextPermission === "denied") {
          setMessage({
            tone: "error",
            text: "Nao deu para abrir a camera. Confere a permissao do navegador.",
          });
          return;
        }
      }
    }

    cameraInputRef.current?.click();
  }

  async function requestCurrentLocation() {
    const currentPermission = await readPermissionState("geolocation");
    setLocationPermission(currentPermission);

    if (currentPermission === "denied") {
      setMessage({
        tone: "error",
        text: "Libera a localizacao no navegador para usar teu ponto atual.",
      });
      return;
    }

    if (!navigator.geolocation) {
      setMessage({
        tone: "error",
        text: "Teu aparelho nao liberou localizacao por aqui.",
      });
      return;
    }

    setIsLocating(true);
    setMessage(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDraft((current) => ({
          ...current,
          locationLat: position.coords.latitude,
          locationLng: position.coords.longitude,
          locationNote:
            current.locationNote || "Localizacao compartilhada pelo aparelho",
        }));
        setIsLocating(false);
        setLocationPermission("granted");
        setMessage({
          tone: "success",
          text: "Localizacao adicionada ao anuncio.",
        });
      },
      () => {
        setIsLocating(false);
        void readPermissionState("geolocation").then(setLocationPermission);
        setMessage({
          tone: "error",
          text: "Nao foi possivel usar tua localizacao agora.",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }

  async function uploadListingMedia(userId: string) {
    if (!selectedImageFiles.length) {
      return [];
    }

    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      throw new Error("upload-client-unavailable");
    }

    const uploadedUrls: string[] = [];

    for (const file of selectedImageFiles) {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${extension}`;

      const { error } = await supabase.storage.from(listingMediaBucket).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

      if (error) {
        throw error;
      }

      const { data } = supabase.storage.from(listingMediaBucket).getPublicUrl(path);
      uploadedUrls.push(data.publicUrl);
    }

    return uploadedUrls;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!isSupabaseConfigured()) {
      setMessage({
        tone: "error",
        text: "Publicar ainda nao esta liberado nesta previa.",
      });
      return;
    }

    const price = Number(draft.price.replace(",", "."));

    if (!draft.title || !draft.description || Number.isNaN(price) || price <= 0) {
      setMessage({
        tone: "error",
        text: "Preenche titulo, valor e descricao para colocar isso no radar.",
      });
      return;
    }

    if (isHousingCategory(draft.category) && !draft.housing.paymentDay) {
      setMessage({
        tone: "error",
        text: "Moradia precisa de dia de pagamento para entrar bem no feed.",
      });
      return;
    }

    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      setMessage({
        tone: "error",
        text: "Nao deu para abrir a publicacao agora.",
      });
      return;
    }

    startTransition(() => {
      void (async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setMessage({
            tone: "info",
            text: "Entra na tua conta para publicar no feed.",
          });
          return;
        }

        let uploadedImageUrls: string[] = [];

        if (selectedImageFiles.length) {
          try {
            uploadedImageUrls = await uploadListingMedia(user.id);
          } catch {
            setMessage({
              tone: "error",
              text:
                "Nao deu para enviar as imagens. Confere se o bucket do Supabase esta criado e acessivel.",
            });
            return;
          }
        }

        const tags = buildAutoTags(draft);
        const housing = serializeHousingDetails(draft);

        const { error } = await supabase.from("listings").insert({
          owner_id: user.id,
          seller_name:
            user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Perfil CAMPUS",
          seller_course: draft.sellerCourse || null,
          intent: draft.intent,
          campus: draft.campus,
          type: draft.type,
          category: draft.category,
          focus: draft.focus || null,
          item_condition: draft.type === "product" ? draft.itemCondition : null,
          negotiation_mode: draft.negotiationMode,
          image_url: uploadedImageUrls[0] ?? null,
          gallery_urls: uploadedImageUrls.length ? uploadedImageUrls : null,
          location_note: draft.locationNote || null,
          location_lat: draft.locationLat,
          location_lng: draft.locationLng,
          housing_details: housing,
          title: draft.title,
          description: draft.description,
          price,
          price_unit: draft.priceUnit || null,
          delivery_mode: draft.deliveryMode,
          tags,
          status: "active",
          featured: false,
        });

        if (error) {
          setMessage({
            tone: "error",
            text: "Nao rolou publicar agora. Tenta de novo em instantes.",
          });
          return;
        }

        setMessage({
          tone: "success",
          text:
            draft.intent === "request"
              ? "Demanda publicada. Agora e esperar as propostas aparecerem."
              : "Oferta publicada. Te vejo no feed.",
        });

        router.push("/feed?publicado=1");
        router.refresh();
      })();
    });
  }

  return (
    <div className="composer-grid">
      <section className="form-shell">
        <div className="split-header">
          <div>
            <span className="eyebrow">Novo anuncio</span>
            <h2 className="form-title">Criar anuncio</h2>
          </div>

          <div className="toggle-stack">
            <div className="toggle-group">
              <span className="toggle-label">Formato</span>
              <div className="type-switch" role="tablist" aria-label="Formato do anuncio">
                <button
                  type="button"
                  className={`type-pill ${draft.intent === "offer" ? "active" : ""}`}
                  onClick={() => changeIntent("offer")}
                >
                  Oferta
                </button>
                <button
                  type="button"
                  className={`type-pill ${draft.intent === "request" ? "active" : ""}`}
                  onClick={() => changeIntent("request")}
                >
                  Demanda
                </button>
              </div>
            </div>

            <div className="toggle-group">
              <span className="toggle-label">Tipo</span>
              <div className="type-switch" role="tablist" aria-label="Tipo do anuncio">
                <button
                  type="button"
                  className={`type-pill ${draft.type === "service" ? "active" : ""}`}
                  onClick={() => changeType("service")}
                >
                  Servico
                </button>
                <button
                  type="button"
                  className={`type-pill ${draft.type === "product" ? "active" : ""}`}
                  onClick={() => changeType("product")}
                >
                  Produto
                </button>
              </div>
            </div>
          </div>
        </div>

        {sessionEmail ? (
          <div className="status-banner" data-tone="success">
            Publicando como <strong>{sessionEmail}</strong>
          </div>
        ) : (
          <div className="status-banner" data-tone="info">
            Entra para publicar.{" "}
            <Link href="/#conta" className="form-link">
              Criar conta
            </Link>
          </div>
        )}

        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="listing-title">Titulo</label>
            <input
              id="listing-title"
              className="input-field"
              placeholder={
                isHousingCategory(draft.category)
                  ? draft.intent === "request"
                    ? "Ex.: Procuro vaga feminina perto do campus"
                    : "Ex.: Vaga em republica com internet inclusa"
                  : draft.intent === "request"
                    ? draft.type === "service"
                      ? "Ex.: Procuro aula particular de Fisica"
                      : "Ex.: Procuro Kindle usado"
                    : draft.type === "service"
                      ? "Ex.: Aula particular de Matematica"
                      : "Ex.: Notebook Dell seminovo"
              }
              value={draft.title}
              onChange={(event) => updateField("title", event.target.value)}
              required
            />
          </div>

          <div className="field-grid">
            <div className="field">
              <label htmlFor="listing-category">Categoria</label>
              <select
                id="listing-category"
                className="select-field"
                value={draft.category}
                onChange={(event) => changeCategory(event.target.value)}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="listing-focus">{getFocusLabel(draft.category)}</label>
              <select
                id="listing-focus"
                className="select-field"
                value={draft.focus}
                onChange={(event) => updateField("focus", event.target.value)}
              >
                {focusOptions.map((focus) => (
                  <option key={focus} value={focus}>
                    {focus}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field-grid">
            <div className="field">
              <label htmlFor="listing-campus">Campus</label>
              <select
                id="listing-campus"
                className="select-field"
                value={draft.campus}
                onChange={(event) => updateField("campus", event.target.value)}
              >
                {campusOptions.map((campus) => (
                  <option key={campus} value={campus}>
                    {campus}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="listing-course">Curso ou area</label>
              <input
                id="listing-course"
                className="input-field"
                placeholder="Ex.: Matematica, Design, Nutricao, Ciencia da Computacao"
                value={draft.sellerCourse}
                onChange={(event) => updateField("sellerCourse", event.target.value)}
              />
            </div>
          </div>

          <div className="field-grid">
            <div className="field">
              <label htmlFor="listing-price">
                {isHousingCategory(draft.category)
                  ? draft.intent === "request"
                    ? "Quanto consegue pagar por mes?"
                    : "Valor por pessoa"
                  : draft.intent === "request"
                    ? "Quanto pensa em pagar?"
                    : "Preco"}
              </label>
              <input
                id="listing-price"
                className="input-field"
                inputMode="decimal"
                placeholder={isHousingCategory(draft.category) ? "Ex.: 650" : "Ex.: 120"}
                value={draft.price}
                onChange={(event) => updateField("price", event.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="listing-negotiation">Negociacao</label>
              <select
                id="listing-negotiation"
                className="select-field"
                value={draft.negotiationMode}
                onChange={(event) =>
                  updateField("negotiationMode", event.target.value as NegotiationMode)
                }
              >
                <option value="fixed">Preco fixo</option>
                <option value="negotiable">Aceita ofertas</option>
              </select>
            </div>
          </div>

          {draft.type === "service" && !isHousingCategory(draft.category) ? (
            <div className="field-grid">
              <div className="field">
                <label htmlFor="listing-unit">
                  {draft.intent === "request" ? "Como quer pagar?" : "Cobranca"}
                </label>
                <input
                  id="listing-unit"
                  className="input-field"
                  placeholder="hora, diaria, projeto, entrega"
                  value={draft.priceUnit}
                  onChange={(event) => updateField("priceUnit", event.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="listing-delivery">
                  {draft.intent === "request" ? "Como precisa que role?" : "Como rola?"}
                </label>
                <input
                  id="listing-delivery"
                  className="input-field"
                  placeholder="Presencial, online, hibrido..."
                  value={draft.deliveryMode}
                  onChange={(event) => updateField("deliveryMode", event.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="field-grid">
              {isHousingCategory(draft.category) ? (
                <div className="field">
                  <label htmlFor="listing-unit">Cobranca</label>
                  <input
                    id="listing-unit"
                    className="input-field"
                    value={draft.priceUnit}
                    onChange={(event) => updateField("priceUnit", event.target.value)}
                    placeholder="mes"
                  />
                </div>
              ) : (
                <div className="field">
                  <label htmlFor="listing-condition">Estado do item</label>
                  <select
                    id="listing-condition"
                    className="select-field"
                    value={draft.itemCondition}
                    onChange={(event) =>
                      updateField("itemCondition", event.target.value as ItemCondition)
                    }
                  >
                    <option value="used">Usado</option>
                    <option value="new">Novo</option>
                  </select>
                </div>
              )}

              <div className="field">
                <label htmlFor="listing-delivery">
                  {isHousingCategory(draft.category)
                    ? "Entrada e visita"
                    : draft.intent === "request"
                      ? "Como prefere receber?"
                      : "Entrega"}
                </label>
                <input
                  id="listing-delivery"
                  className="input-field"
                  placeholder={
                    isHousingCategory(draft.category)
                      ? "Visita combinada, contrato simples, entrada imediata..."
                      : "Retirada, entrega local, correio..."
                  }
                  value={draft.deliveryMode}
                  onChange={(event) => updateField("deliveryMode", event.target.value)}
                />
              </div>
            </div>
          )}

          {isHousingCategory(draft.category) ? (
            <details className="fold-panel" open>
              <summary className="fold-summary">Moradia compartilhada</summary>
              <div className="fold-content">
                <div className="field-grid">
                  <div className="field">
                    <label htmlFor="housing-kind">Formato</label>
                    <select
                      id="housing-kind"
                      className="select-field"
                      value={draft.housing.listingKind}
                      onChange={(event) =>
                        updateHousingField(
                          "listingKind",
                          event.target.value as HousingListingKind,
                        )
                      }
                    >
                      {getHousingListingKindOptions().map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label htmlFor="housing-gender">Genero</label>
                    <select
                      id="housing-gender"
                      className="select-field"
                      value={draft.housing.genderPreference}
                      onChange={(event) =>
                        updateHousingField(
                          "genderPreference",
                          event.target.value as HousingGenderPreference,
                        )
                      }
                    >
                      {getHousingGenderOptions().map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="field-grid">
                  <div className="field">
                    <label htmlFor="housing-total-rent">Aluguel total</label>
                    <input
                      id="housing-total-rent"
                      className="input-field"
                      inputMode="decimal"
                      placeholder="Ex.: 2600"
                      value={draft.housing.totalRent}
                      onChange={(event) =>
                        updateHousingField("totalRent", event.target.value)
                      }
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="housing-payment-day">Dia do pagamento</label>
                    <input
                      id="housing-payment-day"
                      className="input-field"
                      inputMode="numeric"
                      placeholder="Ex.: 5"
                      value={draft.housing.paymentDay}
                      onChange={(event) =>
                        updateHousingField("paymentDay", event.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="field-grid">
                  <div className="field">
                    <label htmlFor="housing-available-slots">Vagas disponiveis</label>
                    <input
                      id="housing-available-slots"
                      className="input-field"
                      inputMode="numeric"
                      placeholder="Ex.: 1"
                      value={draft.housing.availableSlots}
                      onChange={(event) =>
                        updateHousingField("availableSlots", event.target.value)
                      }
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="housing-total-residents">Total de moradores</label>
                    <input
                      id="housing-total-residents"
                      className="input-field"
                      inputMode="numeric"
                      placeholder="Ex.: 4"
                      value={draft.housing.totalResidents}
                      onChange={(event) =>
                        updateHousingField("totalResidents", event.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="field-grid">
                  <div className="field">
                    <label htmlFor="housing-bedrooms">Quartos</label>
                    <input
                      id="housing-bedrooms"
                      className="input-field"
                      inputMode="numeric"
                      placeholder="Ex.: 3"
                      value={draft.housing.bedrooms}
                      onChange={(event) =>
                        updateHousingField("bedrooms", event.target.value)
                      }
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="housing-bathrooms">Banheiros</label>
                    <input
                      id="housing-bathrooms"
                      className="input-field"
                      inputMode="numeric"
                      placeholder="Ex.: 2"
                      value={draft.housing.bathrooms}
                      onChange={(event) =>
                        updateHousingField("bathrooms", event.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="field-grid">
                  <div className="field">
                    <label htmlFor="housing-garage-spots">Garagem</label>
                    <input
                      id="housing-garage-spots"
                      className="input-field"
                      inputMode="numeric"
                      placeholder="0, 1, 2..."
                      value={draft.housing.garageSpots}
                      onChange={(event) =>
                        updateHousingField("garageSpots", event.target.value)
                      }
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="housing-available-from">Entrada a partir de</label>
                    <input
                      id="housing-available-from"
                      className="input-field"
                      type="date"
                      value={draft.housing.availableFrom}
                      onChange={(event) =>
                        updateHousingField("availableFrom", event.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="field">
                  <label>Incluso e estrutura</label>
                  <div className="tag-row">
                    {[
                      { key: "furnished", label: "Mobiliado", active: draft.housing.furnished },
                      { key: "acceptsPets", label: "Pet friendly", active: draft.housing.acceptsPets },
                      { key: "internetIncluded", label: "Internet", active: draft.housing.internetIncluded },
                      { key: "waterIncluded", label: "Agua", active: draft.housing.waterIncluded },
                      { key: "electricityIncluded", label: "Energia", active: draft.housing.electricityIncluded },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        className={`type-pill ${item.active ? "active" : ""}`}
                        onClick={() =>
                          updateHousingField(
                            item.key as keyof HousingDraft,
                            !item.active as never,
                          )
                        }
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field">
                  <label>Obrigacoes da casa</label>
                  <div className="tag-row">
                    {housingObligationOptions.map((option) => {
                      const active = draft.housing.obligations.includes(option.value);

                      return (
                        <button
                          key={option.value}
                          type="button"
                          className={`type-pill ${active ? "active" : ""}`}
                          onClick={() => toggleHousingObligation(option.value)}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </details>
          ) : null}

          <div className="field">
            <label htmlFor="listing-description">Descricao</label>
            <textarea
              id="listing-description"
              className="textarea-field"
              rows={6}
              placeholder={
                isHousingCategory(draft.category)
                  ? "Conta como funciona a divisao, a rotina da casa, o que entra no valor e que tipo de convivio tu espera."
                  : draft.intent === "request"
                    ? "Conta o que esta procurando, prazo, faixa de valor e o que faria essa proposta te interessar."
                    : "Conta o que e, como funciona, em que estado esta e o que faz esse anuncio valer a pena."
              }
              value={draft.description}
              onChange={(event) => updateField("description", event.target.value)}
              required
            />
          </div>

          <details className="fold-panel" open={isHousingCategory(draft.category)}>
            <summary className="fold-summary">Imagens e localizacao</summary>
            <div className="fold-content">
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(event) =>
                  replaceSelectedImages(
                    event.target.files?.[0] ? [event.target.files[0]] : [],
                  )
                }
              />

              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(event) =>
                  replaceSelectedImages(Array.from(event.target.files ?? []))
                }
              />

              <div className="media-action-row">
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => void requestCameraCapture()}
                >
                  <Camera size={16} />
                  Tirar foto
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => galleryInputRef.current?.click()}
                >
                  <ImagePlus size={16} />
                  {isHousingCategory(draft.category)
                    ? "Escolher ate 4 imagens"
                    : "Escolher do aparelho"}
                </button>
                {selectedImagePreviews.length ? (
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={removeSelectedImages}
                  >
                    <X size={16} />
                    Remover imagens
                  </button>
                ) : null}
              </div>

              <div className="field">
                <label htmlFor="listing-location-note">Local aproximado</label>
                <input
                  id="listing-location-note"
                  className="input-field"
                  placeholder="Ex.: Rua da biblioteca, centro, pavilhao de aulas"
                  value={draft.locationNote}
                  onChange={(event) => updateField("locationNote", event.target.value)}
                />
              </div>

              <div className="media-action-row">
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => void requestCurrentLocation()}
                  disabled={isLocating}
                >
                  <MapPin size={16} />
                  {isLocating ? "Buscando localizacao..." : "Usar localizacao atual"}
                </button>
                {draft.locationLat && draft.locationLng ? (
                  <span className="active-filter-pill">Localizacao adicionada</span>
                ) : null}
                {selectedImagePreviews.length ? (
                  <span className="active-filter-pill">
                    {selectedImagePreviews.length} imagem(ns)
                  </span>
                ) : null}
              </div>

              <div className="permission-chip-row" aria-label="Permissoes do aparelho">
                <span className="active-filter-pill">
                  Camera{" "}
                  {cameraPermission === "granted"
                    ? "liberada"
                    : cameraPermission === "denied"
                      ? "bloqueada"
                      : "sob demanda"}
                </span>
                <span className="active-filter-pill">
                  Localizacao{" "}
                  {locationPermission === "granted"
                    ? "liberada"
                    : locationPermission === "denied"
                      ? "bloqueada"
                      : "sob demanda"}
                </span>
              </div>
            </div>
          </details>

          <div className="status-banner" data-tone="info">
            {negotiationModeHints[draft.negotiationMode]}
          </div>

          <div className="form-actions">
            <button className="action-button" type="submit" disabled={isPending}>
              {isPending
                ? "Publicando..."
                : draft.intent === "request"
                  ? "Publicar demanda"
                  : "Publicar oferta"}
            </button>
            <Link className="secondary-button" href="/feed">
              Voltar ao feed
            </Link>
          </div>
        </form>

        {message ? (
          <div className="status-banner" data-tone={message.tone}>
            {message.text}
          </div>
        ) : null}
      </section>

      <aside className="preview-card">
        <span className="account-chip">
          <Sparkles size={16} />
          {draft.intent === "request" ? "Previa da demanda" : "Previa da oferta"}
        </span>

        <div className="preview-media">
          {selectedImagePreviews[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selectedImagePreviews[0]} alt="" loading="lazy" />
          ) : (
            <div className="preview-media-placeholder">
              <ImageIcon size={22} />
              <strong>Capa do anuncio</strong>
              <span>Foto tirada no celular ou escolhida da galeria entra aqui.</span>
            </div>
          )}
        </div>

        <h3>{draft.title || "Teu anuncio aparece assim"}</h3>
        <p>
          {draft.description ||
            "Escreve como se estivesse chamando alguem no direct: claro, rapido e sem enrolacao."}
        </p>

        <div className="tag-row">
          <span className="tag">{listingIntentLabels[draft.intent]}</span>
          <span className="tag">{listingTypeLabels[draft.type]}</span>
          <span className="tag">{draft.category}</span>
          {draft.focus ? <span className="tag">{draft.focus}</span> : null}
          {isHousingCategory(draft.category) ? (
            <span className="tag">
              {housingGenderPreferenceLabels[draft.housing.genderPreference]}
            </span>
          ) : draft.type === "product" ? (
            <span className="tag">{itemConditionLabels[draft.itemCondition]}</span>
          ) : null}
        </div>

        <div className="preview-price">
          <strong>{getPriceHeadline(draft)}</strong>
          <span>{negotiationModeLabels[draft.negotiationMode]}</span>
        </div>

        <p className="preview-note">
          {draft.deliveryMode || getDefaultDeliveryMode(draft.intent, draft.type, draft.category)}
        </p>

        {draft.locationNote ? (
          <p className="preview-note">
            <strong>Local:</strong> {draft.locationNote}
          </p>
        ) : null}

        {housingDetails ? (
          <>
            <div className="tag-row">
              <span className="tag">{housingListingKindLabels[housingDetails.listingKind]}</span>
              <span className="tag">{getHousingPaymentLabel(housingDetails.paymentDay)}</span>
              {housingDetails.availableSlots ? (
                <span className="tag">{housingDetails.availableSlots} vaga(s)</span>
              ) : null}
            </div>

            {housingIncludedItems.length ? (
              <div className="tag-row">
                {housingIncludedItems.map((item) => (
                  <span key={item} className="tag">
                    {item}
                  </span>
                ))}
              </div>
            ) : null}

            {draft.housing.obligations.length ? (
              <ul className="helper-list">
                {getHousingObligationText(draft.housing.obligations).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </>
        ) : null}

        <Link className="primary-button" href="/feed">
          Ver anuncios publicados
          <ArrowRight size={18} />
        </Link>
      </aside>
    </div>
  );
}
