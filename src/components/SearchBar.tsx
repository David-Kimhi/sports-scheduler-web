// ──────────────────────────────────────────────────────────────────────────────
// File: src/components/SearchBar.tsx
// 
// A designed search bar
// ──────────────────────────────────────────────────────────────────────────────
import { FiFilter } from "react-icons/fi";
import type { Entity } from "../interfaces/api.interface";
import { Pill } from "./Pill";

export function SearchBar({
  query,
  setQuery,
  filters,
  onRemovePill,
  onIconClick,
}: {
  query: string;
  setQuery: (v: string) => void;
  filters: Entity[];
  onRemovePill: (e: Entity) => void;
  onIconClick: () => void;
}) {
  return (
    <div className="mt-4 mb-8 flex items-stretch gap-4 w-full">
      <div className="flex flex-wrap items-center gap-2 p-2 border bg-white border-gray-300 rounded-full shadow-md flex-1 relative">
        <FiFilter className="text-gray-400 text-xl cursor-pointer ml-2" onClick={onIconClick} />
        <div className="flex flex-wrap flex-1 items-center">
          {filters.map((f) => (
            <Pill key={`${f.type}-${f.id}`} item={f} onRemove={onRemovePill} />
          ))}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={filters.length === 0 && query === "" ? "Filter countries, leagues, teams..." : ""}
            className="flex-1 py-0.5 pr-3 outline-none text-lg min-w-[150px]"
          />
        </div>
      </div>
    </div>
  );
}
