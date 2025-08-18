import { forwardRef, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from "react";

import { GameCard } from "./GameCard";
import { type Entity } from "../interfaces/api.interface";
import { FiChevronRight } from "react-icons/fi";
import ExportModal, { type CalendarEvent } from"./ExportPopup";


// Build CalendarEvent[] from your game objects
function toCalendarEvents(games: Entity[]): CalendarEvent[] {
  return games.map((g) => {
    const startISO = g.date ?? new Date().toISOString();
    const start = new Date(startISO);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // default 2h

    const venue = g.venueName ? `${g.venueName}, ` : ""
    const city = g.venueCity ? `${g.venueCity}` : ""
    const location = `${venue}${city}`
  
    return {
      id: String(g.id),
      title: `${g.homeTeamName ?? "Home"} vs ${g.awayTeamName ?? "Away"}`,
      description: g.round ? `Round: ${g.round}${g.league ? ` • ${g.league}` : ""}` : g.league ?? undefined,
      location: location,
      start: startISO,
      end,
    };
  });
}


const handleGoogle = async (events: CalendarEvent[]) => {
  // TODO: trigger OAuth, create/pick a calendar, insert events
  // Example shape you’ll need later:
  // await fetch("/api/google/insert", { method: "POST", body: JSON.stringify({ events }) });
  console.log("Add to Google Calendar", events);
};


export type GameSectionHandle = {
  openExport: () => void;
};

export const GameSection = forwardRef<GameSectionHandle, {
  items: Entity[];
  isSearchingGames: boolean;
}>(
  function GameSection({ items, isSearchingGames}, ref) {
  const filterOptions = ["home", "away", "both"] as const;
  type FilterType = typeof filterOptions[number];

  // Helper so numbers/strings both work
  const hasSelected = (id: string | number) => selectedGames.has(String(id)) || selectedGames.has(Number(id));

  // States
  const [selectedGames, setSelectedGames] = useState<Set<string | number>>(new Set());
  const [teamFilter, setTeamFilter] = useState<FilterType>("both");
  const [exportOpen, setExportOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    openExport: () => setExportOpen(true),
  }));



  const selectedTeamIds = items[0]?.selectedTeamIds ?? [];
  const hasTeamFilter = selectedTeamIds.length > 0;
  const now = new Date();

  const upcomingGames = items
    .filter((g) => !!g.date && new Date(g.date) > now)
    .sort((a, b) => new Date(a.date ?? "").getTime() - new Date(b.date ?? "").getTime());

  const filteredGames = upcomingGames.filter((game) => {
    const homeId = game.homeTeamId!.toString();
    const awayId = game.awayTeamId!.toString();
    const selected = game.selectedTeamIds?.map(String) ?? [];
    if (!hasTeamFilter) return true;
    if (teamFilter === "home") return selected.includes(homeId);
    if (teamFilter === "away") return selected.includes(awayId);
    return selected.includes(homeId) || selected.includes(awayId);
  });

  // Memoize the final list we pass to the modal
  const exportEvents: CalendarEvent[] = useMemo(() => {
    const base = selectedGames.size > 0
      ? filteredGames.filter((g) => hasSelected(g.id))
      : filteredGames;

    return toCalendarEvents(base);
  }, [selectedGames, filteredGames]);

  const toggleGame = (id: string | number) =>
    setSelectedGames((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      
      return next;
    });

  const selectAll = () => {
    if (selectedGames.size === items.length) setSelectedGames(new Set());
    else setSelectedGames(new Set(filteredGames.map((g) => g.id)));
  };

  // --- Layout refs & vars
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const setVars = () => {
      const header = headerRef.current?.getBoundingClientRect().height ?? 0;
      const footer = document.getElementById("export-bar")?.getBoundingClientRect().height ?? 0;
      if (sectionRef.current) {
        sectionRef.current.style.setProperty("--header-h", `${header}px`);
        sectionRef.current.style.setProperty("--footer-h", `${footer}px`);
      }
    };
    setVars();
    window.addEventListener("resize", setVars);
    return () => window.removeEventListener("resize", setVars);
  }, []);

  return (
    <div id="games-section" ref={sectionRef} className="min-h-vh min-h-svh snap-start">
      <div className="mx-auto h-full grid grid-rows-[auto,1fr,auto]">

        {/* Row 1: Header / Filters */}
        <div className="pt-4 pb-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h3 className="ml-6 inline-flex items-center gap-1 text-primary bg-accent px-3 py-1 rounded-full text-sm font-medium shadow-lg shadow-accent">
                Events <FiChevronRight />
              </h3>
              <button onClick={selectAll} className="text-accent underline hover:text-blue-900 text-sm">
                {selectedGames.size === filteredGames.length ? "Unselect All" : "Select All"}
              </button>
            </div>

            <div className="flex rounded-full bg-gray-200 px-0.5 py-0.5 text-sm">
              {filterOptions.map((type) => (
                <button
                  key={type}
                  onClick={() => setTeamFilter(type)}
                  className={`px-3 py-1 rounded-full transition-colors ${
                    teamFilter === type ? "bg-accent text-primary" : "text-[#80715f] hover:bg-gray-300"
                  } ${!hasTeamFilter ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Middle scroll window (with fades) */}
        <div className="relative overflow-hidden">
          <div
            className="h-full overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 pr-1"
            style={{
              WebkitMaskImage:
                `linear-gradient(to bottom, transparent 0, black 16px, black calc(100% - 16px), transparent 100%)`,
              maskImage:
                `linear-gradient(to bottom, transparent 0, black 16px, black calc(100% - 16px), transparent 100%)`,
              scrollbarWidth: "none",
            }}
          >
            <div className="col-span-full h-4 md:h-6" />
            {isSearchingGames ? (
              <div className="col-span-full w-full py-10 text-center text-gray-500 text-lg flex justify-center items-center gap-3">
                {/* spinner ... */}
                <svg className="animate-spin h-5 w-5 text-gray-500" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                <span>Searching...</span>
              </div>
            ) : upcomingGames.length === 0 ? (
              <div className="col-span-full w-full py-10 text-center text-gray-500 text-lg">
                No games found. Try using the search or filters to discover games.
              </div>
            ) : (
              filteredGames.map((game) => (
                <div key={`game-${game.id}`}>
                  <GameCard
                    homeTeam={{ name: game.homeTeamName ?? "Unknown", logoId: String(game.homeTeamId ?? "0") }}
                    awayTeam={{ name: game.awayTeamName ?? "Unknown", logoId: String(game.awayTeamId ?? "0") }}
                    dateUTC={game.date ?? new Date().toISOString()}
                    isSelected={selectedGames.has(game.id)}
                    round={game.round}
                    onToggle={() => toggleGame(game.id)}
                    leagueName={game.league}
                  />
                </div>
              ))
            )}
            <div className="col-span-full h-4 md:h-6" />
          </div>
        </div>

        {/* Row 3: Bottom-centered Export button */}
        {items.length > 0 && (
          <div className="py-3">
            <div className="flex justify-center">
              <button
                onClick={() => setExportOpen(true)}
                disabled={items.length === 0}
                className="w-full max-w-[420px] px-5 py-2 bg-third text-primary rounded-full hover:bg-gray-400 text-sm disabled:opacity-50"
              >
                Export {selectedGames.size > 0 ? `${selectedGames.size} Selected` : `${filteredGames.length}`} Games
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal stays outside rows */}
      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        events={exportEvents}
        calendarName="My Matches"
        onAddToGoogle={handleGoogle}
      />
    </div>

  );
});

