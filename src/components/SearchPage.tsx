import { useState, useEffect, useRef } from "react";
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
  const [isSearchingGames, setIsSearchingGames] = useState(false);

  const [data, setData] = useState<EntityData>({
    country: [],
    league: [],
    team: [],
    game: [],
  });

  const gameSectionRef = useRef<HTMLDivElement>(null);

  // Put selected (pending + active) first, then the rest. Dedup by type:id.
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
    const pending = pendingFilters.filter((f) => f.type === type);
    const active  = filters.filter((f) => f.type === type);
    return dedupeById<Entity>([...pending, ...active, ...items]);
  };


  const fetchResults = (opts?: { games?: boolean; ignoreFilters?: boolean; useFilters?: Entity[]; useQuery?: string }) => {
    const params = new URLSearchParams();
    const q = opts?.useQuery ?? query;
  
    // ✅ Effective filters = exactly what caller asked to use
    const effectiveFilters = opts?.ignoreFilters ? [] : (opts?.useFilters ?? filters);
  
    if (q && !opts?.games) params.append("word", q);
    if (!opts?.ignoreFilters) {
      effectiveFilters.forEach((f) => {
        if (f.id != null) params.append(f.type, String(f.id));
      });
    }
  
    // ✅ teamIds come from effective filters (not pending)
    const teamIds = effectiveFilters
      .filter((f) => f.type === "team")
      .map((f) => String(f.id));
  
    if (opts?.games) {
      params.append("games", "true");
      params.append("limit", "100");
    }
  
    fetch(`${BACKEND_BASE}${FOOTBALL_ENDPOINT}/search?${params.toString()}`)
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
  
        // ✅ Only prepend the *effective* filters (not pending unless caller says so)
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
  

  const applyFilters = () => {
    const merged = [...filters];
    pendingFilters.forEach((pf) => {
      if (!merged.find((f) => f.id === pf.id)) merged.push(pf);
    });
    setFilters(merged);
    setPendingFilters([]);
    setQuery('');
  
    // 🔥 Fetch non-game data using the new active filters
    fetchResults({ useFilters: merged });
  };
  

  const clearAllFilters = () => {
    setFilters([]);
    setPendingFilters([]);
    fetchResults({ useFilters: [] });
  };

  const togglePendingFilter = (item: Entity) => {
    // Build next states based on *current* values
    const inPending = pendingFilters.some((f) => f.id === item.id);
    const inActive  = filters.some((f) => f.id === item.id);
    const existsAnywhere = inPending || inActive;
  
    let nextPending = pendingFilters;
    let nextActive = filters;
  
    if (existsAnywhere) {
      // Remove from BOTH lists
      nextPending = pendingFilters.filter((f) => f.id !== item.id);
      nextActive  = filters.filter((f) => f.id !== item.id);
    } else {
      // Add to pending (not active yet)
      nextPending = [...pendingFilters, item];
      nextActive  = filters;
    }
  
    // Apply state updates
    setPendingFilters(nextPending);
    setFilters(nextActive);
  
    // 🔄 Refresh non-game results immediately with the *next active* filters only
    // (so removal actually reflects in results)
    fetchResults({ useFilters: nextActive, useQuery: query });
  };
  
  
  

  const removePill = (item: Entity) => {
    const nextPending = pendingFilters.filter((f) => f.id !== item.id);
    const nextActive  = filters.filter((f) => f.id !== item.id);
  
    setPendingFilters(nextPending);
    setFilters(nextActive);
  
    fetchResults({ useFilters: nextActive, useQuery: query });
  };
  

  const searchGames = () => {
    const merged = [...filters];
    pendingFilters.forEach((pf) => {
      if (!merged.find((f) => f.id === pf.id)) merged.push(pf);
    });
  
    // Clear current games and show loader
    setData(prev => ({ ...prev, game: [] }));
    setIsSearchingGames(true);
  
    fetchResults({
      games: true,
      useFilters: merged,
      useQuery: "",
    });
  
    gameSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  

  const sections = [
    { title: "Countries", type: "country" as const, items: pinSelected("country", data.country) },
    { title: "Leagues",  type: "league"  as const, items: pinSelected("league",  data.league)  },
    { title: "Teams",    type: "team"    as const, items: pinSelected("team",    data.team)    },
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
                className="flex items-center bg-selected-card text-accent-2 px-3 py-0.5 rounded-full text-xs mr-2 mb-1"
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
              ? "border border-gray-300 opacity-70"
              : "gradient-border"
          }`}
        >
          <button
            onClick={(e) => {
              e.currentTarget.blur();
              searchGames();
            }}
            disabled={filters.length === 0 && pendingFilters.length === 0}
            className={`px-6 py-2 w-full h-full rounded-full bg-primary text-primary
              active:bg-primary focus:bg-blue-100 transition-colors duration-100 outline-none
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

      <div ref={gameSectionRef} className="pt-8">
        <GameSection items={data.game} isSearchingGames={isSearchingGames} />
      </div>
    </div>
  );
}
