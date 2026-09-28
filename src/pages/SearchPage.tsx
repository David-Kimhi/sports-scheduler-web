// ──────────────────────────────────────────────────────────────────────────────
// File: src/pages/SearchPage.tsx
// ──────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { API_BASE, FOOTBALL_ENDPOINT } from "../config";
import type { Entity } from "../interfaces/api.interface";
import type { EntityData } from "../interfaces/entityTypes.interface";
import { Section } from "../components/Section";
import { GameSection, type GameSectionHandle } from "../components/GameSection";
import SiteBrand from "../components/SiteBrand";
import { SearchBar } from "../components/SearchBar";
import { UpcomingGames } from "../components/UpcomingGames";
import { buildParams, dedupeById, mapSearchResults, pinSelected, type SearchApiResponse } from "../utils/search.utils";
import { getLocationProfile } from "../utils/geoLoc.utils";
import { logSearchEvent, type SearchLogPayload } from "../interfaces/analytics.interface";

const POPULAR_LOOKUPS = [
  { query: "Premier League", preferredTypes: ["league", "team"] as const },
  { query: "Champions League", preferredTypes: ["league", "team"] as const },
  { query: "Barcelona", preferredTypes: ["team", "league"] as const },
  { query: "Real Madrid", preferredTypes: ["team", "league"] as const },
  { query: "Arsenal", preferredTypes: ["team", "league"] as const },
];

type SearchRequestOptions = {
  games?: boolean;
  ignoreFilters?: boolean;
  filters?: Entity[];
  query?: string;
  trackSubmit?: boolean;
};

function findMatchingEntity(data: EntityData, query: string, preferredTypes: Array<Entity["type"]>) {
  const normalized = query.trim().toLowerCase();
  for (const type of preferredTypes) {
    const found = data[type]?.find((item) => {
      const name = item.name.toLowerCase();
      return name === normalized || name.includes(normalized);
    });
    if (found) return found;
  }
  return null;
}

function collectPopularEntities(data: EntityData) {
  const picked = POPULAR_LOOKUPS.map(({ query, preferredTypes }) =>
    findMatchingEntity(data, query, [...preferredTypes])
  ).filter((entity): entity is Entity => Boolean(entity));

  return dedupeById(picked).slice(0, 5);
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Entity[]>([]);
  const [isSearchingGames, setIsSearchingGames] = useState(false);
  const [hasSubmittedScheduleSearch, setHasSubmittedScheduleSearch] = useState(false);
  const [popularEntities, setPopularEntities] = useState<Entity[]>([]);
  const [discoveryGames, setDiscoveryGames] = useState<Entity[]>([]);
  const [data, setData] = useState<EntityData>({ country: [], league: [], team: [], game: [] });

  const gameSectionRef = useRef<HTMLDivElement>(null);
  const gameSectionApiRef = useRef<GameSectionHandle>(null);
  const panesRef = useRef<HTMLDivElement>(null);

  const searchGamesDisabled = filters.length === 0;

  // if an entity was selected 
  const isSelected = useCallback(
    (it: Entity) => filters.some(f => f.id === it.id && f.type === it.type),
    [filters]
  );

  // last entered filter
  const lastEnterAddedRef = useRef<{id: string | number; type: Entity["type"]} | null>(null);


  const bestMatch = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;

    type EntityBuckets = Pick<EntityData, "country" | "league" | "team">;
    const pools: Array<keyof EntityBuckets> = ["country", "league", "team"];
    for (const type of pools) {
      const list = data[type] ?? [];
      const found = list.find((it: Entity) => {
        if (isSelected(it)) return false;           // don’t re-select pinned/selected
        const name = it.name.toLowerCase();
        return name.includes(q);
      });
      if (found) return found;
    }
    return null;
  }, [query, data, isSelected]);

  const suggestionLabel = useMemo(() => {
    if (!bestMatch) return "";
    const name = bestMatch.name;
    const q = query.trim().toLowerCase();
    const n = String(name);
    // Prefer prefix-completion visual; if not prefix, show full name as the hint.
    const starts = n.toLowerCase().startsWith(q);
    return starts ? n : n; // keep simple: show full name; SearchBar will render ghost after `query`
  }, [bestMatch, query]);


  // viewport unit handling (mobile safe 100vh)
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

  const postSearchEvent = useCallback(async (args: {
    query: string;
    stage: "submit" | "typeahead"
    filters: Entity[];
    numOfRecords: number;
    elapsedMS: number;
  }) => {
    // Fire-and-forget analytics — do NOT block the UI
      try {
        // Optional: try to enrich with client geolocation
        let clientLoc: SearchLogPayload["clientLoc"] | undefined;
        try {
          const profile = await getLocationProfile("en");     // from earlier helper
          clientLoc = {
            city: profile.city,
            country: profile.country,
            countryCode: profile.countryCode,
            region: profile.region,
            postcode: profile.postcode,
            geo: { type: "Point", coordinates: [profile.point.lng, profile.point.lat] }
          };
        } catch (err) {console.error("postSearchEvent error:", err) }
  
        // Send compact payload; server will add IP/UA reliably
        await logSearchEvent(API_BASE, {
          query: args.query,
          filters: args.filters.map(f => ({ type: f.type, id: String(f.id), label: f.name  })),
          stage: args.stage,
          numOfRecords: args.numOfRecords,
          elapsedMS: args.elapsedMS,
          clientLoc,
        });
      } catch (err) {console.error("postSearchEvent error:", err) }

    }, [filters])

  const requestSearchResults = useCallback(async (opts?: SearchRequestOptions) => {
    const effectiveFilters = opts?.ignoreFilters ? [] : (opts?.filters ?? []);
    const searchQuery = opts?.query ?? "";

    const params = buildParams({ query: searchQuery, filters: effectiveFilters, games: opts?.games });
    const startedAt = performance.now();

    const response = await fetch(`${API_BASE}${FOOTBALL_ENDPOINT}/search?${params.toString()}`);
    const raw: SearchApiResponse = await response.json();
    const resultData = mapSearchResults(raw, {
      games: opts?.games,
      selectedTeamIds: effectiveFilters.filter((filter) => filter.type === "team").map((filter) => String(filter.id)),
    });

    return {
      resultData,
      effectiveFilters,
      searchQuery,
      elapsedMS: Math.round(performance.now() - startedAt),
    };
  }, []);

  const fetchResults = useCallback(async (opts?: SearchRequestOptions) => {
    const queryToUse = opts?.query ?? query;
    const filtersToUse = opts?.filters ?? filters;

    try {
      const { resultData, effectiveFilters, searchQuery, elapsedMS } = await requestSearchResults({
        ...opts,
        query: queryToUse,
        filters: filtersToUse,
      });

      setData((prev) => ({ ...resultData, game: opts?.games ? resultData.game : prev.game }));

      if (opts?.games) {
        setIsSearchingGames(false);
        if (opts?.trackSubmit) {
          const resultsCount = (resultData.game ?? []).length;
          postSearchEvent({
            query: searchQuery,
            stage: "submit",
            filters: effectiveFilters,
            numOfRecords: resultsCount,
            elapsedMS,
          });
        }
      }

      return resultData;
    } catch (err) {
      console.error("Fetch error:", err);
      if (opts?.games) setIsSearchingGames(false);
      return null;
    }
  }, [filters, postSearchEvent, query, requestSearchResults]);

  useEffect(() => { void fetchResults(); }, [fetchResults]);
  useEffect(() => { void fetchResults({ games: false }); }, [query, fetchResults]);

  useEffect(() => {
    let cancelled = false;

    const loadDiscovery = async () => {
      try {
        const response = await requestSearchResults({ query: "", filters: [], ignoreFilters: true });
        if (cancelled) return;

        setDiscoveryGames(response.resultData.game ?? []);

        const initialPopular = collectPopularEntities(response.resultData);
        if (initialPopular.length >= 5) {
          setPopularEntities(initialPopular);
          return;
        }

        const missingLookups = POPULAR_LOOKUPS.filter(
          ({ query: lookupQuery }) => !initialPopular.some((entity) => entity.name.toLowerCase() === lookupQuery.toLowerCase())
        );

        const resolved = await Promise.all(
          missingLookups.map(async ({ query: lookupQuery, preferredTypes }) => {
            const lookup = await requestSearchResults({ query: lookupQuery, filters: [] });
            return findMatchingEntity(lookup.resultData, lookupQuery, [...preferredTypes]);
          })
        );

        if (!cancelled) {
          setPopularEntities(dedupeById([...initialPopular, ...resolved.filter((entity): entity is Entity => Boolean(entity))]).slice(0, 5));
        }
      } catch (err) {
        console.error("Discovery load error:", err);
      }
    };

    void loadDiscovery();

    return () => {
      cancelled = true;
    };
  }, [requestSearchResults]);

  const removePill = useCallback((item: Entity) => {
    const next = filters.filter((f) => f.id !== item.id || f.type !== item.type);
    setFilters(next);
    void fetchResults({ filters: next, query });
  }, [filters, query, fetchResults]);

  const toggleFilters = useCallback((item: Entity) => {
    setFilters((prev) => {
      const exists = prev.some((f) => f.id === item.id && f.type === item.type);
      const next = exists ? prev.filter((f) => !(f.id === item.id && f.type === item.type)) : [...prev, item];
      setQuery("");
      void fetchResults({ filters: next, query: "" });
      return next;
    });
  }, [fetchResults]);

  const searchGames = useCallback(() => {
    setData((prev) => ({ ...prev, game: [] }));
    setIsSearchingGames(true);
    setHasSubmittedScheduleSearch(true);
    void fetchResults({ games: true, filters, query: "", trackSubmit: true });
  }, [filters, fetchResults]);

  const handleFabSearchClick = useCallback( () => {
    searchGames();
    requestAnimationFrame(() => {
      gameSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    
  }, [searchGames]);

  // when Enter selects a bestMatch, remember it so Backspace can undo
const handleEnter = useCallback(() => {
  if (bestMatch) {
    toggleFilters(bestMatch);
    lastEnterAddedRef.current = { id: bestMatch.id, type: bestMatch.type };
    setQuery(""); // clear after accept (common autocomplete behaviour)
  } else if (!searchGamesDisabled) {handleFabSearchClick()}
}, [bestMatch, handleFabSearchClick, searchGamesDisabled, toggleFilters]);

// remove last or the “enter-added” one
const popLastFilter = useCallback(() => {
  setFilters((prev) => {
    if (prev.length === 0) return prev;

    let idx = prev.length - 1;
    if (lastEnterAddedRef.current) {
      const i = prev.findIndex(
        f => f.id === lastEnterAddedRef.current!.id && f.type === lastEnterAddedRef.current!.type
      );
      if (i !== -1) idx = i;
      lastEnterAddedRef.current = null;
    }

    const next = prev.filter((_, i) => i !== idx);
    // keep data in sync
    void fetchResults({ filters: next, query });
    return next;
  });
}, [fetchResults, query]);

  const sections = [
    { title: "Countries", type: "country" as const, items: pinSelected("country", filters, data.country) },
    { title: "Leagues",  type: "league"  as const, items: pinSelected("league",  filters, data.league)  },
    { title: "Teams",    type: "team"    as const, items: pinSelected("team",    filters, data.team)    },
  ];

  const showPopular = query.trim().length === 0 && filters.length === 0 && popularEntities.length > 0;

  return (
    <div
      ref={panesRef}
      // mobile: full viewport height via --vh, smooth snap scroll; desktop unchanged
      className="bg-primary fixed inset-0 overflow-y-auto snap-y snap-mandatory scroll-smooth no-scrollbar overscroll-y-contain"
      style={{ minHeight: "calc(var(--vh, 1vh) * 100)" }}
    >
      {/* ───────────── Section 1: Filters/Search (mobile-first spacing) ───────────── */}
      <section 
        className="snap-start flex pc-height-games"
      >
        <div className="w-[92%] sm:w-2/3 mx-auto flex flex-col gap-4 sm:gap-0 pt-4 sm:pt-6">
          <SiteBrand useGradientTitle={false} />

          <SearchBar
            query={query}
            setQuery={setQuery}
            filters={filters}
            onRemovePill={removePill}
            onIconClick={() => fetchResults()}
            onEnter={handleEnter}  
            suggestionLabel={suggestionLabel}     
            onBackspaceEmpty={popLastFilter}  
            fabSearchClick={handleFabSearchClick}
            searchGamesDisabled={searchGamesDisabled}
          />

            {showPopular && (
              <Section
                title="Popular"
                items={popularEntities}
                onSelect={toggleFilters}
                selected={filters}
                activeFilters={filters}
              />
            )}

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
      </section>

      {/* ───────────── Section 2: Games ───────────── */}
      <section
        id="games-section"
        ref={gameSectionRef}
        className="snap-start snap-always"
        style={{ minHeight: "calc(var(--vh, 1vh) * 100)" }}
      >
          <div className="w-[92%] sm:w-2/3 mx-auto">
            {!hasSubmittedScheduleSearch ? (
              <UpcomingGames items={discoveryGames} />
            ) : (
              <GameSection
                ref={gameSectionApiRef}
                items={data.game}
                isSearchingGames={isSearchingGames}
                title="Your Schedule"
                emptyStateMessage="No upcoming games found for this selection."
              />
            )}
        </div>
      </section>
    </div>
  );
}
