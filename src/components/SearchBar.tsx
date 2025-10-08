// ──────────────────────────────────────────────────────────────────────────────
// File: src/components/SearchBar.tsx
// 
// A designed search bar
// ──────────────────────────────────────────────────────────────────────────────
import { FiArrowRight, FiFilter, FiSearch } from "react-icons/fi";
import type { Entity } from "../interfaces/api.interface";
import { Pill } from "./Pill";
import { useLayoutEffect, useRef, useState } from "react";

type SearchBarProps = {
  query: string;
  setQuery: (s: string) => void;
  filters: Entity[];
  onRemovePill: (e: Entity) => void;
  onIconClick: () => void;
  onEnter?: () => void; 
  suggestionLabel?: string;       
  onBackspaceEmpty?: () => void;
  fabSearchClick?: () => void;  
  searchGamesDisabled?: boolean;      
};

export function SearchBar({
  query,
  setQuery,
  filters,
  onRemovePill,
  onIconClick,
  onEnter,
  suggestionLabel = "",
  onBackspaceEmpty,
  fabSearchClick,
  searchGamesDisabled
}: SearchBarProps) {

  const btnRef = useRef<HTMLButtonElement>(null);
  const [rightPad, setRightPad] = useState(56);

  // compute the “ghost” text: we show query + remainder in faint color
  const ghost = (() => {
    const q = query ?? "";
    const s = suggestionLabel ?? "";
    if (!q || !s) return "";
    const lower = s.toLowerCase();
    const ql = q.toLowerCase();
    if (lower.startsWith(ql)) return q + s.slice(q.length); // classic autocomplete remainder
    // If not a prefix, still show suggestion (keeps simple and helpful)
    return s;
  })();

  // track if user clicked inside the search bar
  const [isFocused, setIsFocused] = useState(false);

  const pillsRef = useRef<HTMLDivElement>(null);
  const [leftPad, setLeftPad] = useState(44); // base for icon + gap

  useLayoutEffect(() => {
    const el = pillsRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      // icon+gap ≈ 44px; add pills width + small gap
      setLeftPad(40 + el.clientWidth);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [filters.length]);

  useLayoutEffect(() => {
    const el = btnRef.current;
    if (!el) return;

    const measure = () => {
      const w = el.getBoundingClientRect().width;
      setRightPad(w + 16); // button width + 16px gap
    };
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [searchGamesDisabled]);

  
  return (
    <div className="relative mb-10 rounded-full border bg-white border-gray-300 w-full sm:w-4/5 shadow-md p-2 mx-auto">
      {/* left icon */}
      <button className="absolute left-3 top-1/2 -translate-y-1/2" onClick={onIconClick}>
        <FiFilter className="text-gray-400 text-xl" />
      </button>

      {/* pills */}
      <div ref={pillsRef} className="absolute left-11 top-1/2 -translate-y-1/2 flex gap-1 items-center z-20">
        {filters.map(f => <Pill key={`${f.type}-${f.id}`} item={f} onRemove={onRemovePill} />)}
      </div>

      {/* input */}
      <input
        className="relative z-10 w-full bg-transparent outline-none"
        style={{ paddingLeft: leftPad, paddingRight: rightPad }}
        value={query}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || (e.key === "Tab" && ghost && suggestionLabel)) {
            e.preventDefault();
            onEnter?.();
          } else if (e.key === "Backspace" && (e.currentTarget.value ?? "") === "") {
            onBackspaceEmpty?.();
          }
        }}
        placeholder={filters.length > 0 || query || isFocused ? "" : "Search countries, leagues, teams…"}
        aria-autocomplete="both"
        autoComplete="off"
      />

      {/* ghost suggestion */}
      {query && suggestionLabel && suggestionLabel.toLowerCase().startsWith(query.toLowerCase()) && (
        <div
          className="pointer-events-none absolute top-1/2 -translate-y-1/2 z-0 flex items-center gap-1 text-sm"
          style={{ paddingLeft: leftPad + 4, paddingRight: rightPad }}
          aria-hidden="true"
        >
          <span className="opacity-0">{query}</span>
          <span className="flex items-center bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-xs leading-tight mr-2">
            <span className="text-gray-400 mr-1">→</span>
            {suggestionLabel}
          </span>
        </div>
      )}

      {/* Search button inside bar */}
      <button
        type="button"
        onClick={fabSearchClick}
        disabled={searchGamesDisabled}
        className={[
          "group absolute right-2 top-1/2 -translate-y-1/2 z-20",
          "inline-flex items-center overflow-hidden",          // allow width animation
          "h-7 rounded-full text-sm font-medium shadow-md",
          "bg-gray-900 text-white",
          "px-3 transition-[background,padding] duration-300",
          "disabled:bg-gray-900 disabled:cursor-not-allowed",
          filters.length > 0 || query || isFocused ? "disabled:opacity-20" : "opacity-0 sm:disabled:opacity-20"
        ].join(" ")}
      >
        {/* icon (fades out on hover) */}
        <FiArrowRight className="shrink-0 transition-opacity duration-200 group-hover:opacity-0" />

        {/* label (slides in on hover) */}
        <span
          className="
            ml-2 whitespace-nowrap
            sm:max-w-0 sm:opacity-0
            transition-all duration-300
            sm:group-hover:max-w-[140px] sm:group-hover:opacity-100
          "
        >
          Search Games
        </span>
      </button>

  </div>
  );
}

