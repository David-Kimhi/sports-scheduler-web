import { useState, useEffect } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import { BACKEND_BASE, FOOTBALL_ENDPOINT } from "../config";
import {type Entity, type GameApi, type LeagueApi, type CountryApi, type TeamApi, type EntityType } from "../interfaces/api.interface";


// Import all logos (SVG + PNG) relative to this file
const logos: Record<string, string> = import.meta.glob(
  "../assets/logos/**/*.{svg,png}",
  { eager: true, import: "default" }
);

function Card({ item, onSelect }: { item: Entity; onSelect: (i: Entity) => void }) {
  const id = String(item.id).toLowerCase();
  const logoKey = `../assets/logos/${item.type}/${id}.svg`;
  const pngKey = `../assets/logos/${item.type}/${id}.png`;
  const logoSrc: string | undefined = logos[logoKey] || logos[pngKey];

  const isCountry = item.type === "country";

  return (
    <div
      onClick={() => item.type !== "game" && onSelect(item)}
      className="p-4 rounded-xl shadow-md hover:shadow-lg cursor-pointer flex items-center gap-4 bg-white transition-transform hover:-translate-y-1 w-full max-w-[280px]" // wider cards
    >
      {/* Circular logo (countries) */}
      {isCountry && logoSrc && (
        <div className="relative w-12 h-12 flex-shrink-0">
          <img
            src={logoSrc}
            alt={`${item.name} flag`}
            className="w-full h-full rounded-full object-cover border border-gray-200 shadow-[0_2px_6px_rgba(0,0,0,0.3)]"
          />
          <div className="absolute inset-0 rounded-full shadow-inner pointer-events-none" />
        </div>
      )}

      {/* Smaller logos for teams/leagues */}
      {!isCountry && logoSrc && (
        <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
          <img
            src={logoSrc}
            alt={`${item.name} logo`}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}

      {/* Text Section (truncated name + description) */}
      <div className="flex flex-col flex-1 min-w-0">
        <h4 className="text-lg font-bold text-gray-800 truncate whitespace-nowrap overflow-hidden">
          {item.name}
        </h4>
        {item.description && (
          <p className="text-sm text-gray-500 line-clamp-2">
            {item.description}
          </p>
        )}
      </div>
    </div>
  );
}



function Section({
  title,
  items,
  onSelect,
}: {
  title: string;
  items: Entity[];
  onSelect: (i: Entity) => void;
}) {
  return (
    <div className="mt-6">
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {items.map((item) => (
        <Card key={`${item.type}-${item.id}`} item={item} onSelect={onSelect} />
      ))}
      </div>
    </div>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Entity[]>([]);
  const [data, setData] = useState<{ [K in EntityType]: Entity[] }>({
    country: [],
    league: [],
    team: [],
    game: [],
  });

  // Fetch results whenever query or filters change
  const fetchResults = () => {
    const params = new URLSearchParams();
    if (query) params.append("word", query);

    // Add each filter as a query parameter based on its type
    filters.forEach((f) => {
      params.append(f.type, f.id); // e.g., country=123, league=456
    });

    fetch(`${BACKEND_BASE}${FOOTBALL_ENDPOINT}/search?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setData({
          country: (data.countries as CountryApi[]).map((c) => ({
            id: c.code,
            name: c.name,
            type: "country",
            description: `Country code: ${c.code}`,
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
            // description: `Founded ${t.founded || "N/A"}`,
          })),
          game: (data.fixtures as GameApi[]).map((g) => ({
            id: g.id,
            name: g.name,
            type: "game",
            description: `${g.date}`, // Example
          })),
        })})
      .catch((err) => console.error("Fetch error:", err));
  };

  // Initial fetch
  useEffect(() => {
    fetchResults();
  }, []);

  // Refetch when query or filters change
  useEffect(() => {
    fetchResults();
  }, [query, filters]);

  const handleSelect = (item: Entity) => {
    // Only add non-games as filters
    if (item.type !== "game" && !filters.find((f) => f.id === item.id)) {
      setFilters([...filters, item]);
      setQuery(""); // Optional: clear query when selecting a filter
    }
  };

  const removeFilter = (item: Entity) => {
    setFilters(filters.filter((f) => f.id !== item.id));
  };

  return (
    <div className="w-11/12 sm:w-2/3 mx-auto">
      {/* Search Bar */}
      <div className="flex flex-wrap items-center gap-2 p-2 border border-gray-300 rounded-full shadow-md mt-4">
        {filters.map((f) => (
          <span
            key={f.id}
            className="flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
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
          className="flex-1 py-2 px-3 outline-none text-lg"
        />
      </div>

      {/* Sections */}
      <Section title="Countries" items={data.country} onSelect={handleSelect} />
      <Section title="Leagues" items={data.league} onSelect={handleSelect} />
      <Section title="Teams" items={data.team} onSelect={handleSelect} />
      <Section title="Games" items={data.game} onSelect={() => {}} />

      {/* Add All to Calendar */}
      <div className="mt-6">
        <button className="px-4 py-2 bg-green-500 text-white rounded-md">
          Add All Games to Calendar
        </button>
      </div>
    </div>
  );
}
