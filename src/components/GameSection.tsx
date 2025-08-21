import { forwardRef, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState, useEffect} from "react";

import { ConfirmDialog } from "./ConfirmationDialog";
import { GameCard } from "./GameCard";
import { type Entity } from "../interfaces/api.interface";
import { FiChevronRight } from "react-icons/fi";
import ExportModal, { type CalendarEvent } from "./ExportPopup";

// Build CalendarEvent[] from your game objects
function toCalendarEvents(games: Entity[]): CalendarEvent[] {
  return games.map((g) => {
    const startISO = g.date ?? new Date().toISOString();
    const start = new Date(startISO);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // default 2h

    const venue = g.venueName ? `${g.venueName}, ` : "";
    const city = g.venueCity ? `${g.venueCity}` : "";
    const location = `${venue}${city}`;

    return {
      id: String(g.id),
      title: `${g.homeTeamName ?? "Home"} vs ${g.awayTeamName ?? "Away"}`,
      description: g.round ? `Round: ${g.round}${g.league ? ` • ${g.league}` : ""}` : g.league ?? undefined,
      location,
      start: startISO,
      end,
    };
  });
}

const handleGoogle = async (events: CalendarEvent[]) => {
  console.log("Add to Google Calendar", events);
};

export type GameSectionHandle = {
  openExport: () => void;
};

export const GameSection = forwardRef<GameSectionHandle, {
  items: Entity[];
  isSearchingGames: boolean;
}>(
function GameSection({ items, isSearchingGames }, ref) {
  const filterOptions = ["home", "away", "both"] as const;
  type FilterType = typeof filterOptions[number];

  // top of component
  const MAX_EXPORT = 100;

  // tiny, dependency‑free notifier
  const [notice, setNotice] = useState<string | null>(null);

  // good cross-env typing
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) {
        clearTimeout(noticeTimerRef.current);
        noticeTimerRef.current = null;
      }
    };
  }, []);

  // helper
  const notify = (msg: string) => {
    setNotice(msg);
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = setTimeout(() => setNotice(null), 3000);
  };

  // States
  const [selectedGames, setSelectedGames] = useState<Set<string | number>>(new Set());
  const [teamFilter, setTeamFilter] = useState<FilterType>("both");
  const [exportOpen, setExportOpen] = useState(false);

  // persistent watchlist across searches
  const [watchlist, setWatchlist] = useState<CalendarEvent[]>([]);

  useImperativeHandle(ref, () => ({
    openExport,
  }));

  // Helpers
  const hasSelected = (id: string | number) =>
    selectedGames.has(String(id)) || selectedGames.has(Number(id));

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

  // If user selected specific games -> use only those; else use all filtered results.
  const currentSelectionEvents: CalendarEvent[] = useMemo(() => {
    const base = selectedGames.size > 0
      ? filteredGames.filter((g) => hasSelected(g.id))
      : filteredGames;
    return toCalendarEvents(base);
  }, [selectedGames, filteredGames]);

  // Effective events for export: prefer watchlist if not empty, else current selection
  const effectiveExportEvents = watchlist.length > 0 ? watchlist : currentSelectionEvents;
  const cappedExportEvents = effectiveExportEvents.slice(0, MAX_EXPORT);
  const totalToExport = Math.min(effectiveExportEvents.length, MAX_EXPORT);
  const clipped = effectiveExportEvents.length > MAX_EXPORT;


  const toggleGame = (id: string | number) => {
    setSelectedGames((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {next.delete(id)} else {next.add(id)};
      return next;
    });
    setFrozenLabel(null);
  }

  const selectAll = () => {
    if (selectedGames.size === filteredGames.length) setSelectedGames(new Set());
    else setSelectedGames(new Set(filteredGames.map((g) => g.id)));
  };

  // Watchlist actions ---
  const watchIds = useMemo(() => new Set(watchlist.map(e => e.id)), [watchlist]);
  const selectionSig = useMemo(
    () => currentSelectionEvents.map(e => e.id).sort().join(","),
    [currentSelectionEvents]
  );

  const selectedCount = selectedGames.size;
  const currentCount = selectedCount > 0 ? selectedCount : filteredGames.length;

  // Track last selection signature and a frozen label
  const [lastAddedSig, setLastAddedSig] = useState<string>("");
  const [frozenLabel, setFrozenLabel] = useState<string | null>(null);

  const resultsSig = useMemo(() => {
      const ids = filteredGames.map(g => String(g.id)).sort();
      return ids.join("|");
    }, [filteredGames.map(g => g.id).sort().join("|")]);
    

  // reset on new search
  useEffect(() => {
    setLastAddedSig("");
    setFrozenLabel(null); // unfrozen
    setSelectedGames(new Set())
  }, [resultsSig]);


  // disable logic
  const newlyAdded = useMemo(
    () => currentSelectionEvents.filter(e => !watchIds.has(e.id)),
    [currentSelectionEvents, watchIds]
  );
  
  const addDisabled = newlyAdded.length === 0 || selectionSig === lastAddedSig;
  
  // compute label
  const addBtnLabel = frozenLabel
    ? frozenLabel
    : addDisabled 
    ? selectedCount > 0 
    ? `Selected Games Already Added` : `Games Already Added To Watchlist` 
    : selectedCount > 0 
        ? `Add ${selectedCount} Selected Games To Watchlist`
        : `Add ${currentCount} Games To Watchlist`;


  const addToWatchlist = () => {
    if (addDisabled) return;
  
    // de-duped selection
    const newlyAdded = currentSelectionEvents.filter(e => !watchIds.has(e.id));
  
    if (watchlist.length >= MAX_EXPORT) {
      notify(`Watchlist is full (${MAX_EXPORT}). Remove some to add more.`);
      return;
    }
  
    const remaining = MAX_EXPORT - watchlist.length;
    const toAdd = newlyAdded.slice(0, remaining);
  
    if (toAdd.length === 0) {
      notify(`Watchlist is full (${MAX_EXPORT}). Remove some to add more.`);
      return;
    }
  
    setWatchlist(prev => [...prev, ...toAdd]);
  
    // freeze label to the *actual* added number
    const n = toAdd.length;
    setFrozenLabel(`Added ${n} ${n === 1 ? "Game" : "Games"}`);
    setLastAddedSig(selectionSig);
  
    // if we clipped due to the cap, tell the user
    if (toAdd.length < newlyAdded.length || watchlist.length + toAdd.length === MAX_EXPORT) {
      notify(
        `Added ${toAdd.length}. You’ve reached the ${MAX_EXPORT} game limit.`
      );
    }
  };

  const hasGames = items.length > 0;

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

  const openExport = () => {
    if (effectiveExportEvents.length > MAX_EXPORT) {
      notify(`Export is limited to ${MAX_EXPORT}. Only the first ${MAX_EXPORT} will be exported.`);
    }
    setExportOpen(true);
  };

  // Confirmation Dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [skipConfirm, setSkipConfirm] = useState(
    () => localStorage.getItem("skipClearConfirm") === "true"
  );

  const clearWatchlist = () => {
    if (skipConfirm) {
      // just clear without asking
      setWatchlist([]);
      setLastAddedSig("");
      setFrozenLabel(null);
      notify("Watchlist cleared.");
    } else {
      setConfirmOpen(true);
    }
  };

  return (
    <div id="games-section" ref={sectionRef} className="h-screen snap-start">
      <div className="mx-auto h-full grid grid-rows-[auto,1fr,auto] min-h-0 pb-safe">
        {/* Row 1: Header / Filters */}
        {hasGames && (
          <div className="pt-4 pb-2" ref={headerRef}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h3 className="text-center ml-6 inline-flex items-center gap-1 text-primary bg-accent px-8 py-1 rounded-full text-sm font-medium ">
                  Events <FiChevronRight />
                </h3>

                <button
                  onClick={selectAll}
                  className="text-primary underline hover:text-blue-900 text-sm"
                >
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
        )}

        {/* Row 2: Middle scroll window (with fades) */}
        <div className="relative overflow-hidden min-h-0">
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
                <svg className="animate-spin h-5 w-5 text-gray-500" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
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

        {/* Row 3: Bottom action bar (Clear | Add to watchlist | Export) */}
        {hasGames && (
          <div id="export-bar" className="py-3">
            <div className="mx-auto w-full flex gap-3 items-start">
              
              {/* Left: Clear */}
              <div className="flex-1">
                <button
                  onClick={clearWatchlist}
                  className="w-full px-5 py-2 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-sm disabled:opacity-50"
                  disabled={watchlist.length === 0}
                  title={watchlist.length === 0 ? "Watchlist is empty" : "Clear watchlist"}
                >
                  Clear Watchlist
                </button>
              </div>
          
              {/* Center: Add to watchlist + caption */}
              <div className="flex-1">
                <button
                  onClick={addToWatchlist}
                  disabled={addDisabled}
                  className="w-full px-5 py-2 bg-accent text-primary rounded-full hover:bg-gray-700 text-sm disabled:opacity-50"
                >
                  {addBtnLabel}
                </button>
                <div className="mt-1 text-xs text-gray-600 text-center">
                  You currently have {watchlist.length}/100 {watchlist.length === 1 ? "game" : "games"} in your watchlist
                </div>

                {notice && (
                <div className="mt-1 text-xs text-red-600 text-center">{notice}</div>
              )}

              </div>

         

              {/* Right: Export */}
              <div className="flex-1">
                <button
                  onClick={openExport}
                  className="w-full px-5 py-2 rounded-full bg-gray-700 text-white hover:bg-gray-300 text-sm disabled:opacity-50"
                  disabled={effectiveExportEvents.length === 0}
                  title={
                    effectiveExportEvents.length === 0
                      ? "Nothing to export yet"
                      : `Export ${effectiveExportEvents.length} ${effectiveExportEvents.length === 1 ? "game" : "games"}`
                  }
                >
                  Export {totalToExport} {totalToExport === 1 ? "Game" : "Games"}
                </button>

                {clipped && (
                  <div className="mt-1 text-xs text-amber-600 text-right">
                    Only the first {MAX_EXPORT} will be exported.
                  </div>
                )}
              </div>
            </div>
          </div>
        
        )}
      </div>

      {/* Modal stays outside rows */}
      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        // Use watchlist if available; else use current selection
        events={cappedExportEvents}
        calendarName="Watchlist"
        onAddToGoogle={handleGoogle}
      />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setWatchlist([]);
          setLastAddedSig("");
          setFrozenLabel(null);
          notify("Watchlist cleared.");
        }}
        onDontShowAgain={(checked) => {
          if (checked) {
            setSkipConfirm(true);
            localStorage.setItem("skipClearConfirm", "true");
          }
        }}
        title="Clear Watchlist?"
        message="This will remove all games from your watchlist."
      />
    </div>
  );
});
