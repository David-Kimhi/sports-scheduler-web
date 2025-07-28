import { useState, useEffect } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import { BACKEND_BASE, FOOTBALL_ENDPOINT } from "../config";
import { type Entity, type GameApi, type LeagueApi, type CountryApi, type TeamApi, type EntityType } from "../interfaces/api.interface";
import { GameSection } from "./GameSection";
import { Section } from "./Section";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Entity[]>([]);
  const [pendingFilters, setPendingFilters] = useState<Entity[]>([]);
  const [data, setData] = useState<{ [K in EntityType]: Entity[] }>({
    country: [],
    league: [],
    team: [],
    game: [],
  });

  const fetchResults = (options?: { games?: string, ignoreFilters?: boolean }) => {
    const params = new URLSearchParams();
  
    // If we're typing (ignoreFilters=true), only send the word
    if (query && !options?.games) {
      params.append("word", query);
    }
  
    // Add filters unless explicitly ignored
    if (!options?.ignoreFilters) {
      filters.forEach((f) => {
        if (f.id != null) params.append(f.type, String(f.id));
      });
    }
  
    if (options?.games) {
      params.append("games", options.games);
    }
  
    fetch(`${BACKEND_BASE}${FOOTBALL_ENDPOINT}/search?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setData({
          country: (data.countries as CountryApi[]).map((c) => ({
            id: c.code,
            name: c.name,
            type: "country",
            // description: `Country code: ${c.code}`,
          })),
          league: (data.leagues as LeagueApi[]).map((l) => ({
            id: l.id,
            name: l.name,
            type: "league",
            description: `A ${l.type} in ${l.country}`,
          })),
          team: (data.teams as TeamApi[]).map((t) => ({
            id: t.id,
            name: t.name,
            type: "team",
            description: `A Team in ${t.country}`,
          })),
          game: (data.fixtures as GameApi[]).map((g) => ({
            id: g.id,
            name: g.name,
            type: "game",
            date: typeof g.date === "string" ? g.date : g.date.toISOString(),
            homeTeamId: g.home_id,
            homeTeamName: g.home,
            awayTeamId: g.away_id,
            awayTeamName: g.away,
          })),
        });
      })
      .catch((err) => console.error("Fetch error:", err));
  };

  useEffect(() => {
    fetchResults();
  }, []);

  useEffect(() => {
    if (query) {
      fetchResults({ ignoreFilters: true }); // Search only by query
    } else {
      fetchResults(); // No query, show default or filtered
    }
  }, [query, filters]);
  

  const togglePendingFilter = (item: Entity) => {
    setPendingFilters((prev) =>
      prev.find((f) => f.id === item.id)
        ? prev.filter((f) => f.id !== item.id)
        : [...prev, item]
    );
  };

  const removeFilter = (item: Entity) => {
    setFilters(filters.filter((f) => f.id !== item.id));
  };

  // Trigger search specifically for games
  const searchGames = () => {
    fetchResults({ games: "true" });
  };

  const sections = [
    { title: "Countries", type: "country" as const, items: data.country },
    { title: "Leagues", type: "league" as const, items: data.league },
    { title: "Teams", type: "team" as const, items: data.team },
  ];
  

  return (
    <div className="w-11/12 sm:w-2/3 mx-auto">
      {/* Search Bar */}
      <div className="flex flex-wrap p-2 border border-gray-300 rounded-full shadow-md mt-4 relative">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
        <div className="flex flex-wrap flex-1 pl-10">
          {filters.map((f) => (
            <span
              key={f.id}
              className="flex items-center bg-blue-100 h-7 text-blue-700 px-3 py-0.5 rounded-full text-xs mr-2 mb-1"
            >
              {f.name}
              <FiX
                className="ml-2 cursor-pointer"
                onClick={() => removeFilter(f)}
              />
            </span>
          ))}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search countries, leagues, teams..."
            className="flex-1 py-0.5 pr-3 outline-none text-lg min-w-[150px]"
          />
        </div>

      </div>

      {/* Buttons */}
      <div className="mt-6 flex gap-4">
        <button
          onClick={searchGames}
          disabled={filters.length === 0}
          className={`ml-auto px-4 py-2 rounded-full ${
            filters.length === 0
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-gray-200 text-gray-500 hover:bg-gray-300"
          }`}
  >
          Search Games
        </button>
      </div>

      {/* Sections */}
      {sections.map(({ title, type, items }) => (
        <Section
          key={type}
          title={title}
          items={items}
          onSelect={togglePendingFilter}
          selected={pendingFilters.filter(f => f.type === type)}
          activeFilters={filters.filter(f => f.type === type)}
          hasPendingFilters={pendingFilters.some(f => f.type === type)}
          hasActiveFilters={filters.some(f => f.type === type)}
          onApplyFilters={() => {

            // Clear the search input
            setQuery("");

            setFilters(prev => {
              const newOnes = pendingFilters.filter(
                f => f.type === type && !prev.find(p => p.id === f.id)
              );
              return [...prev, ...newOnes];
            });
            setPendingFilters(prev => prev.filter(f => f.type !== type));
          }}
          onClearFilters={() => {
            setFilters(prev => prev.filter(f => f.type !== type));
          }}
        />
      ))}

      <div className="w-full mt-8">
        <GameSection items={data.game} />
      </div>
    </div>
  );
}
