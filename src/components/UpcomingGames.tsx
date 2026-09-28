import { GameCard } from "./GameCard";
import type { Entity } from "../interfaces/api.interface";

export function UpcomingGames({ items }: { items: Entity[] }) {
  const now = new Date();
  const inSevenDays = new Date(now);
  inSevenDays.setDate(now.getDate() + 7);

  const games = items
    .filter((game) => {
      if (!game.date) return false;
      const gameDate = new Date(game.date);
      return gameDate >= now && gameDate <= inSevenDays;
    })
    .sort((a, b) => new Date(a.date ?? "").getTime() - new Date(b.date ?? "").getTime())
    .slice(0, 6);

  if (games.length === 0) {
    return (
      <section className="mt-6 rounded-3xl bg-white/70 p-4 shadow-md border border-white/60">
        <div className="flex flex-wrap items-end justify-between gap-2 px-1 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-primary">Upcoming Games</h2>
            <p className="text-xs text-gray-600">Choose a team or league to build your schedule.</p>
          </div>
        </div>
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white/70 px-4 py-8 text-sm text-gray-600">
          No upcoming games available right now.
        </div>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-3xl bg-white/70 p-4 shadow-md border border-white/60">
      <div className="flex flex-wrap items-end justify-between gap-2 px-1 pb-3">
        <div>
          <h2 className="text-sm font-semibold text-primary">Upcoming Games</h2>
          <p className="text-xs text-gray-600">Choose a team or league to build your schedule.</p>
        </div>
        <p className="text-[11px] uppercase tracking-wide text-gray-500">Today, tomorrow, and the next 7 days</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {games.map((game) => (
          <GameCard
            key={`discovery-${game.id}`}
            homeTeam={{ name: game.homeTeamName ?? "Unknown", logoId: String(game.homeTeamId ?? "0") }}
            awayTeam={{ name: game.awayTeamName ?? "Unknown", logoId: String(game.awayTeamId ?? "0") }}
            dateUTC={game.date ?? new Date().toISOString()}
            isSelected={false}
            onToggle={() => undefined}
            round={game.round}
            leagueName={game.league}
            selectable={false}
          />
        ))}
      </div>
    </section>
  );
}