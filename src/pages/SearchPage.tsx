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
import { buildParams, mapSearchResults, pinSelected , type SearchApiResponse} from "../utils/search.utils";
import { getLocationProfile } from "../utils/geoLoc.utils";
import { logSearchEvent, type SearchLogPayload } from "../interfaces/analytics.interface";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Entity[]>([]);
  const [isSearchingGames, setIsSearchingGames] = useState(false);
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

  }, [])

  const fetchResults = useCallback((opts?: {
    games?: boolean;
    ignoreFilters?: boolean;
    useFilters?: Entity[];
    useQuery?: string;
  }) => {
    const effectiveFilters = opts?.ignoreFilters ? [] : (opts?.useFilters ?? filters);
    const q = opts?.useQuery ?? query;
  
    const params = buildParams({ query: q, filters: effectiveFilters, games: opts?.games });

    const t0 = performance.now();

    // Kick off the search (your current flow)
    fetch(`${API_BASE}${FOOTBALL_ENDPOINT}/search?${params.toString()}`)
      .then((res) => res.json())
      .then((raw: SearchApiResponse) => {
        const resultData = mapSearchResults(raw, { games: opts?.games, selectedTeamIds: effectiveFilters.filter(f=>f.type==='team').map(f=>String(f.id)) });
        setData((prev) => ({ ...resultData, game: opts?.games ? resultData.game : prev.game }));
        if (opts?.games) {
          setIsSearchingGames(false);
          const resultsCount = (resultData.game ?? []).length;
          const elapsedMs = Math.round(performance.now() - t0);
          postSearchEvent({
            query: query
            , stage: "submit"
            , filters: effectiveFilters
            , numOfRecords: resultsCount
            , elapsedMS: elapsedMs
          });
        }
      })
      .catch((err) => console.error("Fetch error:", err));
  
  }, [filters, query]);

  useEffect(() => { fetchResults(); }, [fetchResults]);
  useEffect(() => { fetchResults({ games: false }); }, [query, fetchResults]);

  const removePill = useCallback((item: Entity) => {
    const next = filters.filter((f) => f.id !== item.id || f.type !== item.type);
    setFilters(next);
    fetchResults({ useFilters: next, useQuery: query });
  }, [filters, query, fetchResults]);

  const toggleFilters = useCallback((item: Entity) => {
    setFilters((prev) => {
      const exists = prev.some((f) => f.id === item.id && f.type === item.type);
      const next = exists ? prev.filter((f) => !(f.id === item.id && f.type === item.type)) : [...prev, item];
      setQuery("");
      fetchResults({ useFilters: next, useQuery: "" });
      return next;
    });
  }, [fetchResults]);

  const searchGames = useCallback(() => {
    setData((prev) => ({ ...prev, game: [] }));
    setIsSearchingGames(true);
    fetchResults({ games: true, useFilters: filters, useQuery: "" });
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
}, [bestMatch, toggleFilters, setQuery]);

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
    fetchResults({ useFilters: next, useQuery: query });
    return next;
  });
}, [fetchResults, query]);

  const sections = [
    { title: "Countries", type: "country" as const, items: pinSelected("country", filters, data.country) },
    { title: "Leagues",  type: "league"  as const, items: pinSelected("league",  filters, data.league)  },
    { title: "Teams",    type: "team"    as const, items: pinSelected("team",    filters, data.team)    },
  ];

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
          <GameSection ref={gameSectionApiRef} items={data.game} isSearchingGames={isSearchingGames} />
        </div>
      </section>
    </div>
  );
}
