// ──────────────────────────────────────────────────────────────────────────────
// File: src/components/SearchBar.tsx
// 
// A designed search bar
// ──────────────────────────────────────────────────────────────────────────────
import { FiFilter } from "react-icons/fi";
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
}: SearchBarProps) {

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

  
    return (
      <div className="relative mb-6 rounded-full border bg-white border-gray-300 shadow-md p-2">

        {/* icon */}
        <button className="absolute left-3 top-1/2 -translate-y-1/2" onClick={onIconClick}>
          <FiFilter className="text-gray-400 text-xl" />
        </button>

        {/* pills flow inline, before the input caret */}
        <div ref={pillsRef} className="absolute left-11 top-1/2 -translate-y-1/2 flex gap-1 items-center">
          {filters.map((f) => (
              <Pill key={`${f.type}-${f.id}`} item={f} onRemove={onRemovePill} />
            ))}
        </div>


        {/* GHOST suggestion: place BEFORE the input and behind it */}
        {query && suggestionLabel && (
          <div
            className="
              pointer-events-none absolute left-[7px] right-0
              top-1/2 -translate-y-1/2
              z-0
              text-gray-400/70
              whitespace-nowrap overflow-hidden text-ellipsis
              text-base leading-6
            "
            style={{ paddingLeft: leftPad, paddingRight: 12 }}
            aria-hidden="true"
          >
            {suggestionLabel.toLowerCase().startsWith(query.toLowerCase())
              ? query + suggestionLabel.slice(query.length)
              : suggestionLabel}
          </div>
        )}

        {/* INPUT: put above the ghost and match font metrics */}
        <input
          className="relative z-10 w-full bg-transparent outline-none text-base leading-6"
          style={{ paddingLeft: leftPad, paddingRight: 12 }}
          value={query}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onEnter?.();
            } else if (e.key === "Tab" && ghost && suggestionLabel) {
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
      </div>
  );
}

