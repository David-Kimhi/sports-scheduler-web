import { useState, useEffect } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import { BACKEND_BASE, FOOTBALL_ENDPOINT } from "../config";
import {
  type Entity,
  type GameApi,
  type LeagueApi,
  type CountryApi,
  type TeamApi,
} from "../interfaces/api.interface";
import { GameSection } from "./GameSection";
import { Section } from "./Section";
import { type EntityData } from "../interfaces/entityTypes.interface";


export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Entity[]>([]); // Active filters
  const [pendingFilters, setPendingFilters] = useState<Entity[]>([]); // Not yet applied
  const [data, setData] = useState<EntityData>({
    country: [],
    league: [],
    team: [],
    game: [],
  });

  const fetchResults = (opts?: { games?: boolean; ignoreFilters?: boolean; useFilters?: Entity[]; useQuery?: string }) => {
    const params = new URLSearchParams();
    const q = opts?.useQuery ?? query;
    const activeFilters = opts?.useFilters ?? filters;
  
    if (q && !opts?.games) {
      params.append("word", q);
    }
    if (!opts?.ignoreFilters) {
      activeFilters.forEach((f) => {
        if (f.id != null) params.append(f.type, String(f.id));
      });
    }
    if (opts?.games) {
      params.append("games", "true");
      params.append("limit", "100");
    }
  
    fetch(`${BACKEND_BASE}${FOOTBALL_ENDPOINT}/search?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        // Build base result sets from API
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

  
        // Merge selected + pending filters so they are ALWAYS present
        // Merge selected + pending filters so they are ALWAYS present
        const allFilters = [...filters, ...pendingFilters];
        allFilters.forEach((f) => {
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

  
        setData(prev => ({
            ...resultData,
            game: opts?.games ? resultData.game : prev.game
          }));
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
  

  const applyFilters = () => {
    const merged = [...filters];
    pendingFilters.forEach((pf) => {
      if (!merged.find((f) => f.id === pf.id)) merged.push(pf);
    });
    setFilters(merged);
    setPendingFilters([]);
  
    // 🔥 Fetch non-game data using the new active filters
    fetchResults({ useFilters: merged });
  };
  

  const clearAllFilters = () => {
    setFilters([]);
    setPendingFilters([]);
    fetchResults({ useFilters: [] });
  };

  const togglePendingFilter = (item: Entity) => {
    setPendingFilters((prev) =>
      prev.find((f) => f.id === item.id)
        ? prev.filter((f) => f.id !== item.id)
        : [...prev, item]
    );
    
  };
  

  const removePill = (item: Entity) => {
    // Remove from both filters and pendingFilters
    setPendingFilters((prev) => prev.filter((f) => f.id !== item.id));
    setFilters((prev) => {
      const updated = prev.filter((f) => f.id !== item.id);
      fetchResults({ useFilters: updated });
      return updated;
    });
  };

  const searchGames = () => {
    // Merge applied + pending filters
    const merged = [...filters];
    pendingFilters.forEach((pf) => {
      if (!merged.find((f) => f.id === pf.id)) merged.push(pf);
    });
  
    // Trigger query immediately with merged filters (ignoring query text)
    fetchResults({ games: true, useFilters: merged, useQuery: "" });
  };
  

  const sections = [
    { title: "Countries", type: "country" as const, items: data.country },
    { title: "Leagues", type: "league" as const, items: data.league },
    { title: "Teams", type: "team" as const, items: data.team },
  ];

  return (
    <div className="w-11/12 sm:w-2/3 mx-auto">
      <div className="mt-4 flex items-stretch gap-4 w-full">
        {/* Search Bar */}
        <div className="flex flex-wrap items-center gap-2 p-2 border border-gray-300 rounded-full shadow-md flex-1 relative">
          <FiSearch
            className="text-gray-400 text-xl cursor-pointer ml-2"
            onClick={() => fetchResults()}
          />
          <div className="flex flex-wrap flex-1 items-center">
            {[...filters, ...pendingFilters].map((f) => (
              <span
                key={`${f.type}-${f.id}`}
                className="flex items-center bg-blue-100 h-7 text-blue-700 px-3 py-0.5 rounded-full text-xs mr-2 mb-1"
              >
                {f.name}
                <FiX className="ml-2 cursor-pointer" onClick={() => removePill(f)} />
              </span>
            ))}
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                filters.length === 0 && pendingFilters.length === 0 && query === ""
                  ? "Search countries, leagues, teams..."
                  : ""
              }              
              className="flex-1 py-0.5 pr-3 outline-none text-lg min-w-[150px]"
            />
          </div>
        </div>

        {/* Search Button */}
        <div
          className={`rounded-full p-[2px] ${
            filters.length === 0 && pendingFilters.length === 0
              ? "border border-gray-300 opacity-50"
              : "gradient-border"
          }`}
        >
          <button
            onClick={(e) => {
              e.currentTarget.blur();
              searchGames();
            }}
            disabled={filters.length === 0 && pendingFilters.length === 0}
            className={`px-6 py-2 w-full h-full rounded-full bg-white text-gray-700 
              active:bg-white focus:bg-blue-100 transition-colors duration-100 outline-none
              hover:bg-blue-100
              ${filters.length === 0 && pendingFilters.length === 0 ? "cursor-not-allowed" : ""}`}
          >
            Search Games
          </button>
        </div>
      </div>


      {/* Buttons (Apply / Clear */}
      <div className="mt-6 flex gap-4 items-center">
        {pendingFilters.length > 0 && (
          <button
          className="text-blue-600 text-sm hover:underline"
          onClick={applyFilters}
          >
            Apply Filters
          </button>
        )}
        {filters.length > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-blue-600 text-sm hover:underline"
          >
            Clear Filters
          </button>
        )}
        
      </div>

      {/* Sections */}
      {sections.map(({ title, type, items }) => (
        <Section
          key={type}
          title={title}
          items={items}
          onSelect={togglePendingFilter}
          selected={pendingFilters.filter((f) => f.type === type)}
          activeFilters={filters.filter((f) => f.type === type)}
        />
      ))}

      <div className="w-full mt-8">
        <GameSection items={data.game} />
      </div>
    </div>
  );
}
