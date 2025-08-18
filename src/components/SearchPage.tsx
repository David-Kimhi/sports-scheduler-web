import { useState, useEffect, useRef } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import { API_BASE, FOOTBALL_ENDPOINT } from "../config";
import {
  type Entity,
  type GameApi,
  type LeagueApi,
  type CountryApi,
  type TeamApi,
} from "../interfaces/api.interface";
import { Section } from "./Section";
import { type EntityData } from "../interfaces/entityTypes.interface";
import { GameSection, type GameSectionHandle } from "./GameSection";


export default function SearchPage() {
  // states
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Entity[]>([]); // Active filters
  const [isSearchingGames, setIsSearchingGames] = useState(false);

  // refs
  const gameSectionRef = useRef<HTMLDivElement>(null);
  const gameSectionApiRef = useRef<GameSectionHandle>(null);
  const panesRef = useRef<HTMLDivElement>(null);

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

  const [data, setData] = useState<EntityData>({
    country: [],
    league: [],
    team: [],
    game: [],
  });

  const dedupeById = <T extends Entity>(arr: T[]) => {
    const seen = new Set<string>();
    return arr.filter((x) => {
      const key = `${x.type}:${String(x.id)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const pinSelected = (type: Entity["type"], items: Entity[]) => {
    const active  = filters.filter((f) => f.type === type);
    return dedupeById<Entity>([...active, ...items]);
  };

  const fetchResults = (opts?: { games?: boolean; ignoreFilters?: boolean; useFilters?: Entity[]; useQuery?: string }) => {
    const params = new URLSearchParams();
    const q = opts?.useQuery ?? query;
  
    // Effective filters
    const effectiveFilters = opts?.ignoreFilters ? [] : (opts?.useFilters ?? filters);
  
    if (q && !opts?.games) params.append("word", q);
    if (!opts?.ignoreFilters) {
      effectiveFilters.forEach((f) => {
        if (f.id != null) params.append(f.type, String(f.id));
      });
    }
  
    // teamIds come from effective filters
    const teamIds = effectiveFilters
      .filter((f) => f.type === "team")
      .map((f) => String(f.id));
  
    if (opts?.games) {
      params.append("games", "true");
      params.append("limit", "100");
    }
  
    fetch(`${API_BASE}${FOOTBALL_ENDPOINT}/search?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        const resultData: EntityData = opts?.games
          ? {
              country: [],
              league: [],
              team: [],
              game: (data.fixtures as GameApi[]).map((g) => ({
                id: g.id,
                name: `${g.home} vs ${g.away}`,
                type: "game",
                date: typeof g.date === "string" ? g.date : g.date.toISOString(),
                homeTeamId: Number(g.home_id),
                homeTeamName: g.home,
                awayTeamId: Number(g.away_id),
                awayTeamName: g.away,
                round: g.round,
                league: g.league,
                venueCity: g.venueCity,
                venueName: g.venueName,
                selectedTeamIds: teamIds,
              })),
            }
          : {
              country: (data.countries as CountryApi[]).map((c) => ({
                id: c.code,
                name: c.name,
                type: "country" as const,
              })),
              league: (data.leagues as LeagueApi[]).map((l) => ({
                id: l.id,
                name: l.name,
                type: "league" as const,
                description: `A ${l.type} in ${l.country}`,
              })),
              team: (data.teams as TeamApi[]).map((t) => ({
                id: t.id,
                name: t.name,
                type: "team" as const,
                description: `A Team in ${t.country}`,
              })),
              game: [],
            };
  
        effectiveFilters.forEach((f) => {
          switch (f.type) {
            case "country":
              if (!resultData.country.find((i) => i.id === f.id)) {
                resultData.country.unshift(f as typeof resultData.country[number]);
              }
              break;
            case "league":
              if (!resultData.league.find((i) => i.id === f.id)) {
                resultData.league.unshift(f as typeof resultData.league[number]);
              }
              break;
            case "team":
              if (!resultData.team.find((i) => i.id === f.id)) {
                resultData.team.unshift(f as typeof resultData.team[number]);
              }
              break;
            case "game":
              if (!resultData.game.find((i) => i.id === f.id)) {
                resultData.game.unshift(f as typeof resultData.game[number]);
              }
              break;
          }
        });
  
        setData((prev) => ({
          ...resultData,
          game: opts?.games ? resultData.game : prev.game,
        }));
  
        if (opts?.games) setIsSearchingGames(false);
      })
      .catch((err) => console.error("Fetch error:", err));
  };
  
  

  // Fetch results on first load
  useEffect(() => {
    fetchResults();
  }, []);

  useEffect(() => {
    fetchResults({ games: false }); // Trigger live search for text input
  }, [query]);
  
  const removePill = (item: Entity) => {
    const nextActive  = filters.filter((f) => f.id !== item.id);
  
    setFilters(nextActive);
  
    fetchResults({ useFilters: nextActive, useQuery: query });
  };
  

  const searchGames = () => {
  
    setData(prev => ({ ...prev, game: [] }));
    setIsSearchingGames(true);
  
    fetchResults({ games: true, useFilters: filters, useQuery: "" });
  };

  const handleFabSearchClick = () => {
    searchGames();
    // slide to the games panel
    requestAnimationFrame(() => {
      gameSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const toggleFilters = (item: Entity) => {
    setFilters(prev => {
      const exists = prev.some(f => f.id === item.id && f.type === item.type);
      const next = exists ? prev.filter(f => !(f.id === item.id && f.type === item.type))
                          : [...prev, item];
  
      // clear query if you want
      setQuery('');
  
      // use the *next* filters for the request (no stale closure)
      fetchResults({ useFilters: next, useQuery: '' });
  
      return next;
    });
  };
  
  const sections = [
    { title: "Countries", type: "country" as const, items: pinSelected("country", data.country) },
    { title: "Leagues",  type: "league"  as const, items: pinSelected("league",  data.league)  },
    { title: "Teams",    type: "team"    as const, items: pinSelected("team",    data.team)    },
  ];
  
  return (
    <div
      ref={panesRef}
      className="bg-primary fixed inset-0 overflow-y-auto snap-y snap-mandatory scroll-smooth no-scrollbar overscroll-y-contain pb-safe"
    >
      {/* ===== Panel 1 ===== */}
      <section className="min-h-vh min-h-svh snap-start flex">
        <div className="w-11/12 sm:w-2/3 mx-auto flex flex-col">
          <h1 className="text-center text-4xl text-primary font-bold mb-6 pt-12 pb-3">
            Sports Scheduler
          </h1>

          {/* Search Bar */}
          <div className="mt-4 flex items-stretch gap-4 w-full">
            <div className="flex flex-wrap items-center gap-2 p-2 border bg-white border-gray-300 rounded-full shadow-md flex-1 relative">
              <FiSearch className="text-gray-400 text-xl cursor-pointer ml-2" onClick={() => fetchResults()} />
              <div className="flex flex-wrap flex-1 items-center">
                {filters.map((f) => (
                  <span key={`${f.type}-${f.id}`} className="flex items-center bg-selected-card text-accent-2 px-3 py-0.5 rounded-full text-xs mr-2 mb-1">
                    {f.name}
                    <FiX className="ml-2 cursor-pointer" onClick={() => removePill(f)} />
                  </span>
                ))}
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={filters.length === 0 && query === "" ? "Search countries, leagues, teams..." : ""}
                  className="flex-1 py-0.5 pr-3 outline-none text-lg min-w-[150px]"
                />
              </div>
            </div>
          </div>
  
          {/* Sections */}
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

          {/* Search button */}
          <div className="mt-auto pb-6 flex justify-center">
            <button
              className={[
                "w-full px-5 py-2 rounded-full text-sm shadow-lg transition-colors",
                "text-primary hover:bg-gray-400 bg-accent",
                filters.length === 0 && "opacity-50 cursor-not-allowed"
              ].filter(Boolean).join(" ")}
              onClick={handleFabSearchClick}
              disabled={filters.length === 0}
            >
              Search Games
            </button>
          </div>
        </div>
      </section>

      {/* ===== Panel 2 ===== */}
      <section
        id="games-section"
        ref={gameSectionRef}
        className="min-h-vh min-h-svh snap-start snap-always"
      >
        <div className="w-11/12 sm:w-2/3 mx-auto">
          <GameSection
            ref={gameSectionApiRef}
            items={data.game}
            isSearchingGames={isSearchingGames}
          />
        </div>
      </section>
    </div>
  );
}