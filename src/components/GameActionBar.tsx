export function GameActionBar({
  onClear,
  onAdd,
  onExport,
  clearDisabled,
  addDisabled,
  exportDisabled,
  addLabel,
  notice,
  watchlistLen,
  maxExport,
  clipped,
}: {
  onClear: () => void;
  onAdd: () => void;
  onExport: () => void;
  clearDisabled: boolean;
  addDisabled: boolean;
  exportDisabled: boolean;
  addLabel: string;
  notice: string | null;
  watchlistLen: number;
  maxExport: number;
  clipped: boolean;
}) {
  const noticeStyle = `mt-1 text-xs text-center ${
    notice ? "text-red-600" : "text-gray-600"
  }`;

  return (
    <div
      id="export-bar"
        className={[
            "sticky bottom-0 z-30 bg-primary backdrop-blur border-t border-gray-300",
            "px-3 pt-2 pb-[calc(env(safe-area-inset-bottom,0)+10px)]",
            "sm:static sm:px-0 sm:pt-3 sm:pb-3 sm:bg-transparent sm:border-0 sm:backdrop-blur-0",
          ].join(" ")}
    >
      {/* Buttons container */}
      <div className="mx-auto w-full sm:max-w-none sm:flex sm:items-start sm:gap-3">
        {/* On mobile: vertical stack; on desktop: 3 equal columns */}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-1">

            <div className="w-full sm:flex-1">

                {/* Clear */}
                <button
                    onClick={onClear}
                    disabled={clearDisabled}
                    className="w-full sm:flex-1 min-h-11 px-5 py-2 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-sm disabled:opacity-50"
                    title={clearDisabled ? "Watchlist is empty" : "Clear watchlist"}
                >
                    Clear
                </button>
            </div>

          {/* Add to watchlist */}
          <div className="w-full sm:flex-1">
            <button
              onClick={onAdd}
              disabled={addDisabled}
              className="w-full min-h-11 px-5 py-2 rounded-full bg-accent text-primary hover:bg-gray-400 text-sm disabled:opacity-50"
            >
              {addLabel}
            </button>
            <div className={noticeStyle}>
              {notice
                ? notice
                : <>You have {watchlistLen}/{maxExport} {watchlistLen === 1 ? "game" : "games"} in your watchlist</>}
            </div>
          </div>

          {/* Export */}
          <div className="w-full sm:flex-1">
            <button
              onClick={onExport}
              disabled={exportDisabled}
              className="w-full min-h-11 px-5 py-2 rounded-full bg-gray-700 text-white hover:bg-gray-600 text-sm disabled:opacity-50"
            >
              Export
            </button>
            {clipped && (
              <div className="mt-1 text-xs text-amber-600 text-right sm:text-right">
                Only the first {maxExport} will be exported.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
