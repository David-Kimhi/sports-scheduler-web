// ──────────────────────────────────────────────────────────────────────────────
// File: src/pages/SearchPage.tsx
// ──────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from "react";
import { API_BASE, FOOTBALL_ENDPOINT } from "../config";
import type { Entity } from "../interfaces/api.interface";
import type { EntityData } from "../interfaces/entityTypes.interface";
import { Section } from "../components/Section";
import { GameSection, type GameSectionHandle } from "../components/GameSection";
import SiteBrand from "../components/SiteBrand";
import { SearchBar } from "../components/SearchBar";
import { buildParams, mapSearchResults, pinSelected , type SearchApiResponse} from "../utils/search.utils";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Entity[]>([]);
  const [isSearchingGames, setIsSearchingGames] = useState(false);
  const [data, setData] = useState<EntityData>({ country: [], league: [], team: [], game: [] });

  const gameSectionRef = useRef<HTMLDivElement>(null);
  const gameSectionApiRef = useRef<GameSectionHandle>(null);
  const panesRef = useRef<HTMLDivElement>(null);

  // viewport unit handling
  useEffect(() => {
    const setVH = () => {
      const h = (window.visualViewport?.height ?? window.innerHeight) * 0.01;
      document.documentElement.style.setProperty("--vh", `${h}px`);
    };
    setVH();
    window.addEventListener("resize", setVH);
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

  const fetchResults = useCallback((opts?: {
    games?: boolean;
    ignoreFilters?: boolean;
    useFilters?: Entity[];
    useQuery?: string;
  }) => {
    const effectiveFilters = opts?.ignoreFilters ? [] : (opts?.useFilters ?? filters);
    const q = opts?.useQuery ?? query;

    const teamIds = effectiveFilters.filter((f) => f.type === "team").map((f) => String(f.id));
    const params = buildParams({ query: q, filters: effectiveFilters, games: opts?.games });

    fetch(`${API_BASE}${FOOTBALL_ENDPOINT}/search?${params.toString()}`)
      .then((res) => res.json())
      .then((raw: SearchApiResponse) => {
        const resultData = mapSearchResults(raw, { games: opts?.games, selectedTeamIds: teamIds });

        if (!opts?.games) {
          for (const f of effectiveFilters) {
            const list = resultData[f.type];
            if (!list.find((i) => i.id === f.id)) list.unshift(f);
          }
        }

        setData((prev) => ({ ...resultData, game: opts?.games ? resultData.game : prev.game }));
        if (opts?.games) setIsSearchingGames(false);
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

  const handleFabSearchClick = useCallback(() => {
    searchGames();
    requestAnimationFrame(() => {
      gameSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [searchGames]);

  const sections = [
    { title: "Countries", type: "country" as const, items: pinSelected("country", filters, data.country) },
    { title: "Leagues",  type: "league"  as const, items: pinSelected("league",  filters, data.league)  },
    { title: "Teams",    type: "team"    as const, items: pinSelected("team",    filters, data.team)    },
  ];

  return (
    <div ref={panesRef} className="bg-primary fixed inset-0 overflow-y-auto snap-y snap-mandatory scroll-smooth no-scrollbar overscroll-y-contain pb-safe">
      <section className="min-h-vh min-h-svh snap-start flex">
        <div className="w-11/12 sm:w-2/3 mx-auto flex flex-col">
          <SiteBrand useGradientTitle={false} />

          <SearchBar
            query={query}
            setQuery={setQuery}
            filters={filters}
            onRemovePill={removePill}
            onIconClick={() => fetchResults()}
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

          <div className="mt-auto pb-6 flex justify-center">
            <button
              className={[
                "w-full px-5 py-2 rounded-full text-sm shadow-lg transition-colors ",
                "text-primary hover:bg-gray-400 bg-white ",
                filters.length === 0 && "opacity-50 cursor-not-allowed",
                filters.length > 0 && "border-3 flash-border", 
              ].filter(Boolean).join(" ")}
              onClick={handleFabSearchClick}
              disabled={filters.length === 0}
            >
              Search Games
            </button>
          </div>
        </div>
      </section>

      <section id="games-section" ref={gameSectionRef} className="h-screen snap-start snap-always pb-safe">
        <div className="w-11/12 sm:w-2/3 mx-auto">
          <GameSection ref={gameSectionApiRef} items={data.game} isSearchingGames={isSearchingGames} />
        </div>
      </section>
    </div>
  );
}
