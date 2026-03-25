"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpDown,
  BriefcaseBusiness,
  GraduationCap,
  House,
  Package,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  SquarePen,
  Store,
} from "lucide-react";

import styles from "@/components/marketplace/marketplace-explorer.module.scss";
import { MarketplaceLaneCard } from "@/components/marketplace/marketplace-lane-card";
import { MarketplaceListingCard } from "@/components/marketplace/marketplace-listing-card";
import {
  getHousingGenderLabel,
  getHousingPaymentLabel,
  isHousingCategory,
  type HousingGenderPreference,
} from "@/lib/housing";
import type { Listing } from "@/lib/listings";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  itemConditionLabels,
  listingIntentLabels,
  listingTypeLabels,
  type ItemCondition,
  type ListingIntent,
} from "@/lib/listing-taxonomy";

type FeedWorkspace = "consumer" | "seller";
type SortMode = "relevance" | "price_asc" | "price_desc" | "rating";
type AccountType = "buyer" | "seller" | "service-provider";
type ChromeMode = "default" | "minimal";
type LayoutMode = "grid" | "lanes";
type FeedLaneId = "products" | "housing" | "classes" | "services";

type Props = {
  listings: Listing[];
  initialState?: {
    query?: string;
    type?: "all" | "service" | "product";
    intent?: "all" | ListingIntent;
    category?: string;
    focus?: string;
    condition?: "all" | ItemCondition;
    housingGender?: "all" | HousingGenderPreference;
    housingPaymentDay?: string;
    housingGarage?: "all" | "with_garage";
    sort?: SortMode;
    workspace?: FeedWorkspace;
  };
  syncUrlPath?: string;
  persistedParams?: Record<string, string | undefined>;
  publishedNotice?: boolean;
  headingOverride?: {
    eyebrow?: string;
    title?: string;
    description?: string;
  };
  hideWorkspaceSwitch?: boolean;
  hidePrimaryAction?: boolean;
  lockedWorkspace?: FeedWorkspace;
  chromeMode?: ChromeMode;
  layoutMode?: LayoutMode;
};

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const workspaceCopy: Record<
  FeedWorkspace,
  {
    feedTitle: string;
    feedDescription: string;
    searchPlaceholder: string;
    actionHref: string;
    actionLabel: string;
    emptyTitle: string;
    emptyDescription: string;
  }
> = {
  consumer: {
    feedTitle: "Oportunidades do campus",
    feedDescription: "Trocas, renda e solucoes reais entre estudantes.",
    searchPlaceholder: "Buscar livro, moradia, notebook, aula, montagem...",
    actionHref: "/anunciar?intent=request",
    actionLabel: "Nova demanda",
    emptyTitle: "Nada por aqui.",
    emptyDescription: "Tenta outro filtro ou abre uma demanda.",
  },
  seller: {
    feedTitle: "Demandas e oportunidades",
    feedDescription: "Pedidos reais e gente procurando quem resolve.",
    searchPlaceholder:
      "Buscar demandas, pedidos e pessoas procurando servico...",
    actionHref: "/anunciar?intent=offer",
    actionLabel: "Novo anuncio",
    emptyTitle: "Nada por aqui.",
    emptyDescription: "Tenta outro filtro ou publica algo.",
  },
};

const laneDefinitions: Array<{
  id: FeedLaneId;
  title: string;
  description: string;
  icon: typeof Package;
}> = [
  {
    id: "products",
    title: "Produtos",
    description: "Itens, livros e eletronicos.",
    icon: Package,
  },
  {
    id: "housing",
    title: "Moradia",
    description: "Quartos, casas e vagas.",
    icon: House,
  },
  {
    id: "classes",
    title: "Aulas",
    description: "Monitoria, reforco e banca.",
    icon: GraduationCap,
  },
  {
    id: "services",
    title: "Servicos",
    description: "Freelas, reparos e ajuda.",
    icon: BriefcaseBusiness,
  },
] as const;

function normalizeCategory(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function getLaneIdForListing(listing: Listing): FeedLaneId {
  if (isHousingCategory(listing.category)) {
    return "housing";
  }

  const normalizedCategory = normalizeCategory(listing.category);

  if (normalizedCategory === "aulas e monitoria") {
    return "classes";
  }

  if (listing.type === "service") {
    return "services";
  }

  return "products";
}

function getLaneIdFromFilters(
  category: string,
  type: "all" | "service" | "product",
): FeedLaneId | "all" {
  if (category !== "all") {
    if (isHousingCategory(category)) {
      return "housing";
    }

    if (normalizeCategory(category) === "aulas e monitoria") {
      return "classes";
    }

    return type === "service" ? "services" : "products";
  }

  if (type === "product") {
    return "products";
  }

  if (type === "service") {
    return "services";
  }

  return "all";
}

function getPriceHeadline(listing: Listing) {
  const unit = listing.priceUnit ? ` / ${listing.priceUnit}` : "";
  const value = moneyFormatter.format(listing.price);

  if (listing.intent === "request") {
    return `Ate ${value}${unit}`;
  }

  return `${value}${unit}`;
}

function getRelevanceScore(listing: Listing, normalizedQuery: string) {
  if (!normalizedQuery) {
    return listing.featured ? 12 : 0;
  }

  const title = listing.title.toLowerCase();
  const category = listing.category.toLowerCase();
  const focus = listing.focus?.toLowerCase() ?? "";
  const description = listing.description.toLowerCase();
  let score = listing.featured ? 12 : 0;

  if (title.includes(normalizedQuery)) {
    score += 16;
  }

  if (category.includes(normalizedQuery)) {
    score += 8;
  }

  if (focus.includes(normalizedQuery)) {
    score += 6;
  }

  if (description.includes(normalizedQuery)) {
    score += 4;
  }

  return score;
}

function getFocusLabel(category: string) {
  const normalizedCategory = category
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

  if (normalizedCategory === "livros") {
    return "Tema";
  }

  if (normalizedCategory === "aulas e monitoria") {
    return "Formato e nivel";
  }

  if (normalizedCategory === "transporte comunitario") {
    return "Rota ou recorte";
  }

  return "Recorte";
}

function getDefaultIntentForWorkspace(workspace: FeedWorkspace): ListingIntent {
  return workspace === "consumer" ? "offer" : "request";
}

function mapAccountTypeToWorkspace(accountType?: string | null): FeedWorkspace | null {
  if (accountType === "buyer") {
    return "consumer";
  }

  if (accountType === "seller" || accountType === "service-provider") {
    return "seller";
  }

  return null;
}

function isKnownAccountType(value?: string | null): value is AccountType {
  return value === "buyer" || value === "seller" || value === "service-provider";
}

function getResultSummary(count: number, workspace: FeedWorkspace) {
  if (workspace === "consumer") {
    return count === 1 ? "1 anuncio" : `${count} anuncios`;
  }

  return count === 1 ? "1 oportunidade" : `${count} oportunidades`;
}

export function MarketplaceExplorer({
  listings,
  initialState,
  syncUrlPath,
  persistedParams,
  publishedNotice = false,
  headingOverride,
  hideWorkspaceSwitch = false,
  hidePrimaryAction = false,
  lockedWorkspace,
  chromeMode = "default",
  layoutMode = "grid",
}: Props) {
  const router = useRouter();
  const hasExplicitWorkspace = Boolean(initialState?.workspace || lockedWorkspace);
  const hasInitialFilters = Boolean(
    initialState?.query ||
      (initialState?.category && initialState.category !== "all") ||
      (initialState?.focus && initialState.focus !== "all") ||
      (initialState?.condition && initialState.condition !== "all") ||
      (initialState?.intent && initialState.intent !== "all") ||
      (initialState?.type && initialState.type !== "all") ||
      (initialState?.housingGender && initialState.housingGender !== "all") ||
      (initialState?.housingPaymentDay &&
        initialState.housingPaymentDay !== "all") ||
      (initialState?.housingGarage && initialState.housingGarage !== "all") ||
      (initialState?.sort && initialState.sort !== "relevance"),
  );
  const [query, setQuery] = useState(initialState?.query ?? "");
  const [searchOpen, setSearchOpen] = useState(Boolean(initialState?.query));
  const [filtersOpen, setFiltersOpen] = useState(hasInitialFilters);
  const [focusedLane, setFocusedLane] = useState<FeedLaneId | "all">("all");
  const [workspace, setWorkspace] = useState<FeedWorkspace>(
    initialState?.workspace ?? lockedWorkspace ?? "consumer",
  );
  const [activeType, setActiveType] = useState<"all" | "service" | "product">(
    initialState?.type ?? "all",
  );
  const [activeIntent, setActiveIntent] = useState<"all" | ListingIntent>(
    initialState?.intent ??
      (initialState?.workspace || lockedWorkspace
        ? getDefaultIntentForWorkspace(initialState?.workspace ?? lockedWorkspace ?? "consumer")
        : "offer"),
  );
  const [activeCategory, setActiveCategory] = useState(
    initialState?.category ?? "all",
  );
  const [activeFocus, setActiveFocus] = useState(initialState?.focus ?? "all");
  const [activeCondition, setActiveCondition] = useState<"all" | ItemCondition>(
    initialState?.condition ?? "all",
  );
  const [activeHousingGender, setActiveHousingGender] = useState<
    "all" | HousingGenderPreference
  >(initialState?.housingGender ?? "all");
  const [activeHousingPaymentDay, setActiveHousingPaymentDay] = useState(
    initialState?.housingPaymentDay ?? "all",
  );
  const [activeHousingGarage, setActiveHousingGarage] = useState<
    "all" | "with_garage"
  >(initialState?.housingGarage ?? "all");
  const [sortMode, setSortMode] = useState<SortMode>(
    initialState?.sort ?? "relevance",
  );
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const currentWorkspace = lockedWorkspace ?? workspace;
  const workspaceConfig = workspaceCopy[currentWorkspace];
  const defaultIntent = getDefaultIntentForWorkspace(currentWorkspace);
  const eyebrow = headingOverride?.eyebrow ?? "Feed CAMPUS";
  const title =
    deferredQuery
      ? `Resultados para "${query.trim()}"`
      : headingOverride?.title ?? workspaceConfig.feedTitle;
  const description = headingOverride?.description ?? workspaceConfig.feedDescription;

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

      const rawAccountType = data.user?.user_metadata?.account_type;
      if (!isKnownAccountType(rawAccountType) || hasExplicitWorkspace) {
        return;
      }

      const suggestedWorkspace = mapAccountTypeToWorkspace(rawAccountType);
      if (!suggestedWorkspace) {
        return;
      }

      setWorkspace(suggestedWorkspace);

      if (!initialState?.intent) {
        setActiveIntent(getDefaultIntentForWorkspace(suggestedWorkspace));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [hasExplicitWorkspace, initialState?.intent]);

  const availableCategories = Array.from(
    new Set(
      listings
        .filter((listing) =>
          activeType === "all" ? true : listing.type === activeType,
        )
        .filter((listing) =>
          activeIntent === "all" ? true : listing.intent === activeIntent,
        )
        .map((listing) => listing.category),
    ),
  );
  const categoryFilter =
    activeCategory === "all" || availableCategories.includes(activeCategory)
      ? activeCategory
      : "all";

  const availableFocuses = Array.from(
    new Set(
      listings
        .filter((listing) =>
          activeType === "all" ? true : listing.type === activeType,
        )
        .filter((listing) =>
          activeIntent === "all" ? true : listing.intent === activeIntent,
        )
        .filter((listing) =>
          categoryFilter === "all" ? true : listing.category === categoryFilter,
        )
        .map((listing) => listing.focus)
        .filter(Boolean),
    ),
  ) as string[];
  const focusFilter =
    activeFocus === "all" || availableFocuses.includes(activeFocus)
      ? activeFocus
      : "all";

  const availableConditions = Array.from(
    new Set(
      listings
        .filter((listing) =>
          activeType === "service" ? false : listing.type === "product",
        )
        .filter((listing) =>
          activeIntent === "all" ? true : listing.intent === activeIntent,
        )
        .filter((listing) =>
          categoryFilter === "all" ? true : listing.category === categoryFilter,
        )
        .filter((listing) =>
          focusFilter === "all" ? true : listing.focus === focusFilter,
        )
        .map((listing) => listing.itemCondition)
        .filter(Boolean),
    ),
  ) as ItemCondition[];
  const conditionFilter =
    activeCondition === "all" || availableConditions.includes(activeCondition)
      ? activeCondition
      : "all";

  const isHousingFilter = isHousingCategory(categoryFilter);
  const availableHousingGenders = Array.from(
    new Set(
      listings
        .filter((listing) =>
          activeType === "all" ? true : listing.type === activeType,
        )
        .filter((listing) =>
          activeIntent === "all" ? true : listing.intent === activeIntent,
        )
        .filter((listing) =>
          categoryFilter === "all" ? false : listing.category === categoryFilter,
        )
        .map((listing) => listing.housingDetails?.genderPreference)
        .filter(Boolean),
    ),
  ) as HousingGenderPreference[];
  const housingGenderFilter =
    activeHousingGender === "all" || availableHousingGenders.includes(activeHousingGender)
      ? activeHousingGender
      : "all";

  const availableHousingPaymentDays = Array.from(
    new Set(
      listings
        .filter((listing) =>
          activeType === "all" ? true : listing.type === activeType,
        )
        .filter((listing) =>
          activeIntent === "all" ? true : listing.intent === activeIntent,
        )
        .filter((listing) =>
          categoryFilter === "all" ? false : listing.category === categoryFilter,
        )
        .map((listing) => listing.housingDetails?.paymentDay)
        .filter((value): value is number => typeof value === "number"),
    ),
  ).sort((left, right) => left - right);
  const housingPaymentDayFilter =
    activeHousingPaymentDay === "all" ||
    availableHousingPaymentDays.includes(Number(activeHousingPaymentDay))
      ? activeHousingPaymentDay
      : "all";

  const filteredListings = listings
    .map((listing, index) => ({ listing, index }))
    .filter(({ listing }) => {
      const matchesType =
        activeType === "all" ? true : listing.type === activeType;
      const matchesIntent =
        activeIntent === "all" ? true : listing.intent === activeIntent;
      const matchesCategory =
        categoryFilter === "all" ? true : listing.category === categoryFilter;
      const matchesFocus =
        focusFilter === "all" ? true : listing.focus === focusFilter;
      const matchesCondition =
        conditionFilter === "all"
          ? true
          : listing.itemCondition === conditionFilter;
      const matchesHousingGender =
        !isHousingFilter || housingGenderFilter === "all"
          ? true
          : listing.housingDetails?.genderPreference === housingGenderFilter;
      const matchesHousingPaymentDay =
        !isHousingFilter || housingPaymentDayFilter === "all"
          ? true
          : String(listing.housingDetails?.paymentDay ?? "") === housingPaymentDayFilter;
      const matchesHousingGarage =
        !isHousingFilter || activeHousingGarage === "all"
          ? true
          : Boolean(listing.housingDetails?.garageSpots);
      const searchableContent = [
        listing.title,
        listing.description,
        listing.sellerName,
        listing.sellerCourse,
        listing.category,
        listing.focus ?? "",
        listing.campus,
        listing.locationNote ?? "",
        listing.deliveryMode,
        listing.housingDetails?.genderPreference
          ? getHousingGenderLabel(listing.housingDetails.genderPreference)
          : "",
        listing.housingDetails?.paymentDay
          ? getHousingPaymentLabel(listing.housingDetails.paymentDay)
          : "",
        listingIntentLabels[listing.intent],
        listing.itemCondition ? itemConditionLabels[listing.itemCondition] : "",
        ...listing.tags,
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery =
        deferredQuery.length === 0
          ? true
          : searchableContent.includes(deferredQuery);

      return (
        matchesType &&
        matchesIntent &&
        matchesCategory &&
        matchesFocus &&
        matchesCondition &&
        matchesHousingGender &&
        matchesHousingPaymentDay &&
        matchesHousingGarage &&
        matchesQuery
      );
    })
    .sort((left, right) => {
      if (sortMode === "price_asc") {
        return left.listing.price - right.listing.price;
      }

      if (sortMode === "price_desc") {
        return right.listing.price - left.listing.price;
      }

      if (sortMode === "rating") {
        return right.listing.rating - left.listing.rating;
      }

      const leftScore = getRelevanceScore(left.listing, deferredQuery);
      const rightScore = getRelevanceScore(right.listing, deferredQuery);

      if (leftScore !== rightScore) {
        return rightScore - leftScore;
      }

      return left.index - right.index;
    })
    .map(({ listing }) => listing);

  const activeFilters = [
    activeIntent !== "all" && activeIntent !== defaultIntent
      ? listingIntentLabels[activeIntent]
      : null,
    activeType !== "all" ? listingTypeLabels[activeType] : null,
    categoryFilter !== "all" ? categoryFilter : null,
    focusFilter !== "all" ? focusFilter : null,
    conditionFilter !== "all" ? itemConditionLabels[conditionFilter] : null,
    isHousingFilter && housingGenderFilter !== "all"
      ? getHousingGenderLabel(housingGenderFilter)
      : null,
    isHousingFilter && housingPaymentDayFilter !== "all"
      ? getHousingPaymentLabel(Number(housingPaymentDayFilter))
      : null,
    isHousingFilter && activeHousingGarage !== "all" ? "Com garagem" : null,
  ].filter(Boolean) as string[];
  const showResultRow =
    chromeMode !== "minimal" || activeFilters.length > 0 || Boolean(deferredQuery);
  const derivedLane = getLaneIdFromFilters(categoryFilter, activeType);
  const activeLane =
    layoutMode === "lanes"
      ? derivedLane === "all"
        ? focusedLane
        : derivedLane
      : "all";
  const laneSections = laneDefinitions.map((definition) => ({
    ...definition,
    listings: filteredListings.filter(
      (listing) => getLaneIdForListing(listing) === definition.id,
    ),
  }));
  const visibleLaneSections =
    layoutMode === "lanes"
      ? laneSections.filter((section) =>
          activeLane === "all" ? section.listings.length > 0 : section.id === activeLane,
        )
      : [];

  function resetFilters(nextWorkspace: FeedWorkspace) {
    setActiveIntent(getDefaultIntentForWorkspace(nextWorkspace));
    setActiveType("all");
    setActiveCategory("all");
    setActiveFocus("all");
    setActiveCondition("all");
    setActiveHousingGender("all");
    setActiveHousingPaymentDay("all");
    setActiveHousingGarage("all");
    setSortMode("relevance");
    setFocusedLane("all");
  }

  function clearFilters() {
    resetFilters(currentWorkspace);
  }

  function applyWorkspace(nextWorkspace: FeedWorkspace) {
    if (lockedWorkspace) {
      return;
    }

    setWorkspace(nextWorkspace);
    resetFilters(nextWorkspace);
  }

  function applyCategoryQuickFilter(category: string) {
    if (category === "all") {
      setActiveCategory("all");
      setActiveFocus("all");
      setActiveCondition("all");
      setActiveHousingGender("all");
      setActiveHousingPaymentDay("all");
      setActiveHousingGarage("all");
      setFocusedLane("all");
      return;
    }

    setActiveCategory((current) => (current === category ? "all" : category));
    setActiveFocus("all");
    setActiveCondition("all");
    setActiveHousingGender("all");
    setActiveHousingPaymentDay("all");
    setActiveHousingGarage("all");
  }

  useEffect(() => {
    if (!syncUrlPath) {
      return;
    }

    const params = new URLSearchParams();
    const trimmedQuery = query.trim();

    Object.entries(persistedParams ?? {}).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    if (trimmedQuery) {
      params.set("q", trimmedQuery);
    }

    if (!lockedWorkspace && currentWorkspace !== "consumer") {
      params.set("mode", currentWorkspace);
    }

    if (activeType !== "all") {
      params.set("type", activeType);
    }

    if (activeIntent !== defaultIntent) {
      params.set("intent", activeIntent);
    }

    if (categoryFilter !== "all") {
      params.set("category", categoryFilter);
    }

    if (focusFilter !== "all") {
      params.set("focus", focusFilter);
    }

    if (conditionFilter !== "all") {
      params.set("condition", conditionFilter);
    }

    if (housingGenderFilter !== "all") {
      params.set("housing_gender", housingGenderFilter);
    }

    if (housingPaymentDayFilter !== "all") {
      params.set("housing_payment_day", housingPaymentDayFilter);
    }

    if (activeHousingGarage !== "all") {
      params.set("housing_garage", activeHousingGarage);
    }

    if (sortMode !== "relevance") {
      params.set("sort", sortMode);
    }

    const nextHref = params.size
      ? `${syncUrlPath}?${params.toString()}`
      : syncUrlPath;

    router.replace(nextHref, { scroll: false });
  }, [
    activeIntent,
    activeType,
    categoryFilter,
    conditionFilter,
    defaultIntent,
    focusFilter,
    activeHousingGarage,
    housingGenderFilter,
    housingPaymentDayFilter,
    persistedParams,
    query,
    router,
    sortMode,
    syncUrlPath,
    currentWorkspace,
    lockedWorkspace,
  ]);

  return (
    <section
      className={styles.explorer}
      data-workspace={currentWorkspace}
      data-chrome={chromeMode}
    >
      <div className={styles.topbar}>
        <div className={styles.headerRow}>
          <div className={styles.heading}>
            {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
            <h2 className={styles.title}>{title}</h2>
            {description ? <p className={styles.lead}>{description}</p> : null}
          </div>

          <div className={styles.headerActions}>
            {!hideWorkspaceSwitch && !lockedWorkspace ? (
              <div className="type-switch" role="tablist" aria-label="Modo atual do feed">
                <button
                  type="button"
                  className={`type-pill ${currentWorkspace === "consumer" ? "active" : ""}`}
                  onClick={() => applyWorkspace("consumer")}
                >
                  <ShoppingBag size={16} />
                  Comprar
                </button>
                <button
                  type="button"
                  className={`type-pill ${currentWorkspace === "seller" ? "active" : ""}`}
                  onClick={() => applyWorkspace("seller")}
                >
                  <Store size={16} />
                  Vender
                </button>
              </div>
            ) : null}

            {!hidePrimaryAction ? (
              <Link className={`${styles.createAction} secondary-button`} href={workspaceConfig.actionHref}>
                <SquarePen size={16} />
                {workspaceConfig.actionLabel}
              </Link>
            ) : null}
          </div>
        </div>

        {publishedNotice ? (
          <div className={styles.noticeRow}>
            <span className={styles.noticePill}>Anuncio publicado</span>
          </div>
        ) : null}
      </div>

      <div className={styles.commandArea}>
        <div className={styles.commandDock}>
          <div className={styles.commandButtons}>
            <button
              type="button"
              className={`${styles.commandButton} ${searchOpen ? styles.commandButtonActive : ""}`}
              onClick={() => setSearchOpen((current) => !current)}
              aria-expanded={searchOpen}
              aria-controls="feed-search-panel"
            >
              <Search size={17} />
              <span>Buscar</span>
              {query.trim() ? <em>{query.trim().length}</em> : null}
            </button>

            <button
              type="button"
              className={`${styles.commandButton} ${filtersOpen ? styles.commandButtonActive : ""}`}
              onClick={() => setFiltersOpen((current) => !current)}
              aria-expanded={filtersOpen}
              aria-controls="feed-filter-panel"
            >
              <SlidersHorizontal size={17} />
              <span>Filtros</span>
              {activeFilters.length ? <em>{activeFilters.length}</em> : null}
            </button>
          </div>
        </div>

        {searchOpen ? (
          <div id="feed-search-panel" className={styles.searchPanel}>
            <div className={styles.searchCard}>
              <Search size={18} />
              <input
                className={styles.searchInput}
                type="search"
                placeholder={workspaceConfig.searchPlaceholder}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </div>
        ) : null}

        {filtersOpen ? (
          <div id="feed-filter-panel" className={styles.filterPanelExpanded}>
            <div className={styles.filterIntro}>
              <span className={styles.filterHint}>Categorias, recortes, ordem e estado.</span>

              {activeFilters.length ? (
                <button
                  type="button"
                  className={styles.clearButton}
                  onClick={clearFilters}
                >
                  Limpar
                </button>
              ) : null}
            </div>

            <div className={styles.filterGrid}>
              <div className="field">
                <label htmlFor="feed-sort">Ordenar</label>
                <div className={styles.sortField}>
                  <ArrowUpDown size={14} />
                  <select
                    id="feed-sort"
                    className="select-field"
                    value={sortMode}
                    onChange={(event) => setSortMode(event.target.value as SortMode)}
                  >
                    <option value="relevance">Mais relevantes</option>
                    <option value="price_asc">Menor preco</option>
                    <option value="price_desc">Maior preco</option>
                    <option value="rating">Melhor avaliados</option>
                  </select>
                </div>
              </div>

              {currentWorkspace === "seller" ? (
                <div className="field">
                  <label htmlFor="filter-intent">Mercado</label>
                  <select
                    id="filter-intent"
                    className="select-field"
                    value={activeIntent}
                    onChange={(event) =>
                      setActiveIntent(event.target.value as "all" | ListingIntent)
                    }
                  >
                    <option value="request">Demandas</option>
                    <option value="offer">Ofertas</option>
                    <option value="all">Tudo</option>
                  </select>
                </div>
              ) : null}

              <div className="field">
                <label htmlFor="filter-type">Tipo</label>
                <select
                  id="filter-type"
                  className="select-field"
                  value={activeType}
                  onChange={(event) =>
                    setActiveType(
                      event.target.value as "all" | "service" | "product",
                    )
                  }
                >
                  <option value="all">Tudo</option>
                  <option value="service">Servicos</option>
                  <option value="product">Produtos</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="filter-category">Categoria</label>
                <select
                  id="filter-category"
                  className="select-field"
                  value={categoryFilter}
                  onChange={(event) => setActiveCategory(event.target.value)}
                >
                  <option value="all">Todas</option>
                  {availableCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {availableFocuses.length ? (
                <div className="field">
                  <label htmlFor="filter-focus">{getFocusLabel(categoryFilter)}</label>
                  <select
                    id="filter-focus"
                    className="select-field"
                    value={focusFilter}
                    onChange={(event) => setActiveFocus(event.target.value)}
                  >
                    <option value="all">Todos</option>
                    {availableFocuses.map((focus) => (
                      <option key={focus} value={focus}>
                        {focus}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {activeType !== "service" && availableConditions.length ? (
                <div className="field">
                  <label htmlFor="filter-condition">Estado</label>
                  <select
                    id="filter-condition"
                    className="select-field"
                    value={conditionFilter}
                    onChange={(event) =>
                      setActiveCondition(event.target.value as "all" | ItemCondition)
                    }
                  >
                    <option value="all">Todos</option>
                    {availableConditions.map((condition) => (
                      <option key={condition} value={condition}>
                        {itemConditionLabels[condition]}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {isHousingFilter && availableHousingGenders.length ? (
                <div className="field">
                  <label htmlFor="filter-housing-gender">Genero</label>
                  <select
                    id="filter-housing-gender"
                    className="select-field"
                    value={housingGenderFilter}
                    onChange={(event) =>
                      setActiveHousingGender(
                        event.target.value as "all" | HousingGenderPreference,
                      )
                    }
                  >
                    <option value="all">Todos</option>
                    {availableHousingGenders.map((gender) => (
                      <option key={gender} value={gender}>
                        {getHousingGenderLabel(gender)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {isHousingFilter && availableHousingPaymentDays.length ? (
                <div className="field">
                  <label htmlFor="filter-housing-payment">Pagamento</label>
                  <select
                    id="filter-housing-payment"
                    className="select-field"
                    value={housingPaymentDayFilter}
                    onChange={(event) => setActiveHousingPaymentDay(event.target.value)}
                  >
                    <option value="all">Todos</option>
                    {availableHousingPaymentDays.map((day) => (
                      <option key={day} value={String(day)}>
                        {getHousingPaymentLabel(day)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {isHousingFilter ? (
                <div className="field">
                  <label htmlFor="filter-housing-garage">Garagem</label>
                  <select
                    id="filter-housing-garage"
                    className="select-field"
                    value={activeHousingGarage}
                    onChange={(event) =>
                      setActiveHousingGarage(
                        event.target.value as "all" | "with_garage",
                      )
                    }
                  >
                    <option value="all">Todas</option>
                    <option value="with_garage">Com garagem</option>
                  </select>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {layoutMode === "grid" && availableCategories.length > 1 ? (
        <div className={styles.categoryRow} aria-label="Categorias">
          <button
            type="button"
            className={`${styles.categoryCard} ${
              categoryFilter === "all" ? styles.categoryCardActive : ""
            }`}
            onClick={() => applyCategoryQuickFilter("all")}
          >
            Tudo
          </button>

          {availableCategories.map((category) => (
            <button
              key={category}
              type="button"
              className={`${styles.categoryCard} ${
                categoryFilter === category ? styles.categoryCardActive : ""
              }`}
              onClick={() => applyCategoryQuickFilter(category)}
            >
              {category}
            </button>
          ))}
        </div>
      ) : null}

      {layoutMode === "lanes" ? (
        <div className={styles.laneNav} aria-label="Frentes principais do feed">
          <button
            type="button"
            className={`${styles.laneNavCard} ${activeLane === "all" ? styles.laneNavCardActive : ""}`}
            onClick={() => setFocusedLane("all")}
          >
            <span className={styles.laneNavCopy}>
              <strong>Tudo</strong>
              <span>Visao geral do campus</span>
            </span>
            <em>{filteredListings.length}</em>
          </button>

          {laneSections.map(({ id, title, description, icon: Icon, listings: laneListings }) => (
            <button
              key={id}
              type="button"
              className={`${styles.laneNavCard} ${
                activeLane === id ? styles.laneNavCardActive : ""
              }`}
              onClick={() => setFocusedLane(id)}
              disabled={laneListings.length === 0}
            >
              <span className={styles.laneNavIcon}>
                <Icon size={18} />
              </span>
              <span className={styles.laneNavCopy}>
                <strong>{title}</strong>
                <span>{description}</span>
              </span>
              <em>{laneListings.length}</em>
            </button>
          ))}
        </div>
      ) : null}

      {showResultRow ? (
        <div className={styles.resultRow}>
          <div className={styles.resultCopy}>
            <span>{getResultSummary(filteredListings.length, currentWorkspace)}</span>
          </div>

          {activeFilters.length ? (
            <div className={styles.resultFilters}>
              {activeFilters.map((filter) => (
                <span key={filter} className={styles.filterPill}>
                  {filter}
                </span>
              ))}
              <button
                type="button"
                className={styles.clearButton}
                onClick={clearFilters}
              >
                Limpar
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {layoutMode === "lanes" ? (
        visibleLaneSections.length ? (
          <div className={styles.laneStack}>
            {visibleLaneSections.map((section) => (
              <section key={section.id} className={styles.laneSection}>
                <div className={styles.laneHeader}>
                  <div className={styles.laneHeading}>
                    <span className={styles.laneEyebrow}>{section.description}</span>
                    <h3>{section.title}</h3>
                  </div>
                  <span className={styles.laneCount}>
                    {getResultSummary(section.listings.length, currentWorkspace)}
                  </span>
                </div>

                <div className={styles.laneRail}>
                  {section.listings.map((listing) => (
                    <MarketplaceLaneCard
                      key={listing.id}
                      listing={listing}
                      laneId={section.id}
                      priceHeadline={getPriceHeadline(listing)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-copy">
              <strong>{workspaceConfig.emptyTitle}</strong>
              <p>{workspaceConfig.emptyDescription}</p>
              {!hidePrimaryAction ? (
                <Link className="secondary-button" href={workspaceConfig.actionHref}>
                  {workspaceConfig.actionLabel}
                </Link>
              ) : null}
            </div>
          </div>
        )
      ) : filteredListings.length ? (
        <div className={styles.resultsGrid}>
          {filteredListings.map((listing) => (
            <MarketplaceListingCard
              key={listing.id}
              listing={listing}
              priceHeadline={getPriceHeadline(listing)}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-copy">
            <strong>{workspaceConfig.emptyTitle}</strong>
            <p>{workspaceConfig.emptyDescription}</p>
            {!hidePrimaryAction ? (
              <Link className="secondary-button" href={workspaceConfig.actionHref}>
                {workspaceConfig.actionLabel}
              </Link>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
