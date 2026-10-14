import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { API_BASE, FOOTBALL_ENDPOINT } from "../config";
import type { Entity } from "../interfaces/api.interface";
import type { EntityData } from "../interfaces/entityTypes.interface";
import { Section } from "../components/Section";
import { GameSection } from "../components/GameSection";
import SiteBrand from "../components/SiteBrand";
import { SearchBar } from "../components/SearchBar";
import { buildParams, dedupeById, mapSearchResults, pinSelected, type SearchApiResponse } from "../utils/search.utils";
import { getLocationProfile } from "../utils/geoLoc.utils";
import { logSearchEvent, type SearchLogPayload } from "../interfaces/analytics.interface";

type SearchMode = "home" | "focused" | "results";

type SearchRequestOptions = {
  games?: boolean;
  ignoreFilters?: boolean;
  filters?: Entity[];
  query?: string;
  trackSubmit?: boolean;
};

type DiscoverySection = {
  title: string;
  subtitle: string;
  items: string[];
};

const HOME_DISCOVERY_SECTIONS: DiscoverySection[] = [
  {
    title: "Popular Games",
    subtitle: "Placeholder suggestions for now",
    items: [
      "Premier League: Liverpool vs Arsenal",
      "La Liga: Barcelona vs Sevilla",
      "Champions League: Inter vs Bayern",
    ],
  },
  {
    title: "Happening Now",
    subtitle: "Placeholder suggestions for now",
    items: [
      "Serie A: Milan vs Napoli",
      "Ligue 1: PSG vs Lyon",
      "Eredivisie: Ajax vs PSV",
    ],
  },
  {
    title: "Next Week",
    subtitle: "Placeholder suggestions for now",
    items: [
      "Europa League: Roma vs Porto",
      "Bundesliga: Dortmund vs Leipzig",
      "FA Cup: Chelsea vs Newcastle",
    ],
  },
];

const TYPE_PRIORITY: Record<Entity["type"], number> = {
  country: 0.04,
  league: 0.13,
  team: 0.13,
  game: 0,
};

function scoreWordMatch(name: string, query: string) {
  const q = query.trim().toLowerCase();
  const n = name.trim().toLowerCase();
  if (!q || !n) return 0;

  if (n === q) return 1;
  if (n.startsWith(q)) return 0.92;

  const qTokens = q.split(/\s+/).filter(Boolean);
  const nTokens = n.split(/\s+/).filter(Boolean);

  const overlap = qTokens.filter((token) => nTokens.some((word) => word.includes(token))).length;
  const tokenScore = qTokens.length ? overlap / qTokens.length : 0;

  if (n.includes(q)) return Math.max(0.8, tokenScore);
  return tokenScore * 0.75;
}

function pickClosestEntity(items: Entity[], query: string, selectedKeys: Set<string>) {
  const q = query.trim();
  if (!q) return null;

  let best: { item: Entity; score: number } | null = null;

  for (const item of items) {
    const key = `${item.type}:${String(item.id)}`;
    if (selectedKeys.has(key)) continue;

    const wordScore = scoreWordMatch(item.name, q);
    if (wordScore <= 0) continue;

    const totalScore = wordScore * 0.7 + (TYPE_PRIORITY[item.type] ?? 0);
    if (!best || totalScore > best.score) {
      best = { item, score: totalScore };
    }
  }

  return best?.item ?? null;
}

function DiscoverySectionCards({ section }: { section: DiscoverySection }) {
  return (
    <section className="rounded-3xl bg-white/70 p-4 shadow-md border border-white/60">
      <div className="flex flex-wrap items-end justify-between gap-2 px-1 pb-3">
        <div>
          <h2 className="text-sm font-semibold text-primary">{section.title}</h2>
          <p className="text-xs text-gray-600">{section.subtitle}</p>
        </div>
        <p className="text-[11px] uppercase tracking-wide text-gray-500">Placeholder</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {section.items.map((label) => (
          <article
            key={`${section.title}-${label}`}
            className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm"
          >
            <p className="text-sm font-semibold text-gray-900">{label}</p>
            <p className="mt-1 text-xs text-gray-500">Temporary discovery card</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function SearchPage() {
  const [mode, setMode] = useState<SearchMode>("home");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Entity[]>([]);
  const [isSearchingGames, setIsSearchingGames] = useState(false);
  const [data, setData] = useState<EntityData>({ country: [], league: [], team: [], game: [] });

  const lastEnterAddedRef = useRef<{ id: string | number; type: Entity["type"] } | null>(null);
  const selectedKeys = useMemo(
    () => new Set(filters.map((f) => `${f.type}:${String(f.id)}`)),
    [filters]
  );

  const canSubmit = filters.length > 0 || query.trim().length > 0;

  const postSearchEvent = useCallback(async (args: {
    query: string;
    stage: "submit" | "typeahead";
    filters: Entity[];
    numOfRecords: number;
    elapsedMS: number;
  }) => {
    try {
      let clientLoc: SearchLogPayload["clientLoc"] | undefined;
      try {
        const profile = await getLocationProfile("en");
        clientLoc = {
          city: profile.city,
          country: profile.country,
          countryCode: profile.countryCode,
          region: profile.region,
          postcode: profile.postcode,
          geo: { type: "Point", coordinates: [profile.point.lng, profile.point.lat] },
        };
      } catch (err) {
        console.error("postSearchEvent location error:", err);
      }

      await logSearchEvent(API_BASE, {
        query: args.query,
        filters: args.filters.map((f) => ({ type: f.type, id: String(f.id), label: f.name })),
        stage: args.stage,
        numOfRecords: args.numOfRecords,
        elapsedMS: args.elapsedMS,
        clientLoc,
      });
    } catch (err) {
      console.error("postSearchEvent error:", err);
    }
  }, []);

  const requestSearchResults = useCallback(async (opts?: SearchRequestOptions) => {
    const effectiveFilters = opts?.ignoreFilters ? [] : (opts?.filters ?? []);
    const searchQuery = opts?.query ?? "";

    const params = buildParams({ query: searchQuery, filters: effectiveFilters, games: opts?.games });
    const startedAt = performance.now();

    const response = await fetch(`${API_BASE}${FOOTBALL_ENDPOINT}/search?${params.toString()}`);
    const raw: SearchApiResponse = await response.json();

    const resultData = mapSearchResults(raw, {
      games: opts?.games,
      selectedTeamIds: effectiveFilters
        .filter((filter) => filter.type === "team")
        .map((filter) => String(filter.id)),
    });

    return {
      resultData,
      effectiveFilters,
      searchQuery,
      elapsedMS: Math.round(performance.now() - startedAt),
    };
  }, []);

  const fetchEntityResults = useCallback(async (options?: { query?: string; filters?: Entity[] }) => {
    try {
      const response = await requestSearchResults({
        games: false,
        query: options?.query ?? query,
        filters: options?.filters ?? filters,
      });

      setData((prev) => ({
        ...prev,
        country: response.resultData.country,
        league: response.resultData.league,
        team: response.resultData.team,
      }));
    } catch (err) {
      console.error("Entity fetch error:", err);
    }
  }, [filters, query, requestSearchResults]);

  const bestMatch = useMemo(() => {
    if (!query.trim()) return null;
    const candidates = dedupeById<Entity>([...data.team, ...data.league, ...data.country]);
    return pickClosestEntity(candidates, query, selectedKeys);
  }, [data.country, data.league, data.team, query, selectedKeys]);

  const suggestionLabel = useMemo(() => bestMatch?.name ?? "", [bestMatch]);

  useEffect(() => {
    const setVH = () => {
      const h = (window.visualViewport?.height ?? window.innerHeight) * 0.01;
      document.documentElement.style.setProperty("--vh", `${h}px`);
    };
    setVH();

    window.addEventListener("resize", setVH, { passive: true });
    window.addEventListener("orientationchange", setVH);
    window.visualViewport?.addEventListener("resize", setVH);
    window.visualViewport?.addEventListener("scroll", setVH);

    return () => {
      window.removeEventListener("resize", setVH);
      window.removeEventListener("orientationchange", setVH);
      window.visualViewport?.removeEventListener("resize", setVH);
      window.visualViewport?.removeEventListener("scroll", setVH);
    };
  }, []);

  useEffect(() => {
    if (mode !== "focused") return;

    const timer = window.setTimeout(() => {
      void fetchEntityResults({ query, filters });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [mode, query, filters, fetchEntityResults]);

  const setQueryFromInput = useCallback((value: string) => {
    setQuery(value);
    if (value.trim().length > 0) {
      setMode("focused");
    }
  }, []);

  const removePill = useCallback((item: Entity) => {
    setFilters((prev) => prev.filter((f) => f.id !== item.id || f.type !== item.type));
  }, []);

  const toggleFilters = useCallback((item: Entity) => {
    setMode("focused");
    setFilters((prev) => {
      const exists = prev.some((f) => f.id === item.id && f.type === item.type);
      const next = exists ? prev.filter((f) => !(f.id === item.id && f.type === item.type)) : [...prev, item];
      return next;
    });
    setQuery("");
  }, []);

  const searchGames = useCallback(async () => {
    if (!canSubmit) return;

    const submittedQuery = query.trim();
    let usedFilters = [...filters];

    setMode("results");
    setIsSearchingGames(true);
    setData((prev) => ({ ...prev, game: [] }));

    try {
      const primary = await requestSearchResults({
        games: true,
        filters: usedFilters,
        query: submittedQuery,
        trackSubmit: true,
      });

      let finalGames = primary.resultData.game ?? [];
      let totalElapsed = primary.elapsedMS;

      if (finalGames.length === 0 && usedFilters.length === 0 && submittedQuery) {
        const candidates = dedupeById<Entity>([...data.team, ...data.league, ...data.country]);
        const fallbackEntity = pickClosestEntity(candidates, submittedQuery, selectedKeys);

        if (fallbackEntity) {
          usedFilters = [fallbackEntity];
          setFilters([fallbackEntity]);

          const retry = await requestSearchResults({
            games: true,
            filters: usedFilters,
            query: submittedQuery,
            trackSubmit: true,
          });

          finalGames = retry.resultData.game ?? [];
          totalElapsed += retry.elapsedMS;
        }
      }

      setData((prev) => ({ ...prev, game: finalGames }));

      postSearchEvent({
        query: submittedQuery,
        stage: "submit",
        filters: usedFilters,
        numOfRecords: finalGames.length,
        elapsedMS: totalElapsed,
      });
    } catch (err) {
      console.error("Game search error:", err);
    } finally {
      setIsSearchingGames(false);
    }
  }, [canSubmit, data.country, data.league, data.team, filters, postSearchEvent, query, requestSearchResults, selectedKeys]);

  const handleEnter = useCallback(() => {
    if (bestMatch) {
      toggleFilters(bestMatch);
      lastEnterAddedRef.current = { id: bestMatch.id, type: bestMatch.type };
      setQuery("");
      return;
    }

    if (canSubmit) {
      void searchGames();
    }
  }, [bestMatch, canSubmit, searchGames, toggleFilters]);

  const popLastFilter = useCallback(() => {
    setFilters((prev) => {
      if (prev.length === 0) return prev;

      let idx = prev.length - 1;
      if (lastEnterAddedRef.current) {
        const rememberedIndex = prev.findIndex(
          (f) => f.id === lastEnterAddedRef.current!.id && f.type === lastEnterAddedRef.current!.type
        );
        if (rememberedIndex !== -1) idx = rememberedIndex;
        lastEnterAddedRef.current = null;
      }

      return prev.filter((_, i) => i !== idx);
    });
  }, []);

  const goBack = useCallback(() => {
    if (mode === "results") {
      setMode("focused");
      return;
    }

    setMode("home");
    setQuery("");
    setFilters([]);
    setData((prev) => ({ ...prev, country: [], league: [], team: [] }));
  }, [mode]);

  const sections = [
    { title: "Countries", type: "country" as const, items: pinSelected("country", filters, data.country) },
    { title: "Leagues", type: "league" as const, items: pinSelected("league", filters, data.league) },
    { title: "Teams", type: "team" as const, items: pinSelected("team", filters, data.team) },
  ];

  const isHomeMode = mode === "home";
  const isFocusedMode = mode === "focused";
  const isResultsMode = mode === "results";

  return (
    <div
      className="bg-primary fixed inset-0 overflow-y-auto no-scrollbar overscroll-y-contain"
      style={{ minHeight: "calc(var(--vh, 1vh) * 100)" }}
    >
      <div className="w-[92%] sm:w-2/3 mx-auto pb-safe pb-8 transition-all duration-300 ease-in-out">
        {isHomeMode ? (
          <section className="pt-5 sm:pt-8 transition-all duration-300 ease-in-out">
            <SiteBrand useGradientTitle={false} />

            <div className="transition-all duration-300 ease-in-out">
              <SearchBar
                query={query}
                setQuery={setQueryFromInput}
                filters={filters}
                onRemovePill={removePill}
                onIconClick={() => setMode("focused")}
                onEnter={handleEnter}
                suggestionLabel={suggestionLabel}
                onBackspaceEmpty={popLastFilter}
                fabSearchClick={() => {
                  setMode("focused");
                }}
                searchGamesDisabled={!canSubmit}
                onFocusInput={() => setMode("focused")}
              />
            </div>

            <div className="mt-6 space-y-4">
              {HOME_DISCOVERY_SECTIONS.map((section) => (
                <DiscoverySectionCards key={section.title} section={section} />
              ))}
            </div>
          </section>
        ) : (
          <section className="pt-4 sm:pt-6 transition-all duration-300 ease-in-out min-h-vh">
            <div className="mb-4 flex items-center gap-3">
              <button
                type="button"
                onClick={goBack}
                className="h-10 w-10 rounded-full bg-white shadow-md border border-gray-200 inline-flex items-center justify-center"
                aria-label="Back"
                title="Back"
              >
                <FiArrowLeft className="text-lg text-gray-700" />
              </button>

              <div className="flex-1">
                <SearchBar
                  query={query}
                  setQuery={setQueryFromInput}
                  filters={filters}
                  onRemovePill={removePill}
                  onIconClick={() => void fetchEntityResults({ query, filters })}
                  onEnter={handleEnter}
                  suggestionLabel={suggestionLabel}
                  onBackspaceEmpty={popLastFilter}
                  fabSearchClick={() => {
                    void searchGames();
                  }}
                  searchGamesDisabled={!canSubmit}
                  onFocusInput={() => setMode("focused")}
                />
              </div>
            </div>

            {isFocusedMode && (
              <div className="space-y-2 transition-all duration-300 ease-in-out">
                {sections.map(({ title, type, items }) => (
                  <Section
                    key={type}
                    title={title}
                    items={items}
                    onSelect={toggleFilters}
                    selected={filters.filter((f) => f.type === type)}
                    activeFilters={filters.filter((f) => f.type === type)}
                  />
                ))}
              </div>
            )}

            {isResultsMode && (
              <div className="pt-1 transition-all duration-300 ease-in-out">
                <GameSection
                  items={data.game}
                  isSearchingGames={isSearchingGames}
                  title="Your Schedule"
                  emptyStateMessage="No upcoming games found for this selection."
                />
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
