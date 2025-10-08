import { logos } from '../config';

export function GameCard({
  homeTeam,
  awayTeam,
  dateUTC,
  isSelected,
  onToggle,
  leagueName,
  round,
}: {
  homeTeam: { name: string; logoId: string };
  awayTeam: { name: string; logoId: string };
  dateUTC: string;
  isSelected: boolean;
  onToggle: () => void;
  leagueName?: string;
  round?: string;
}) {

  const date = new Date(dateUTC);

  // ---- date windows (local time, midnight boundaries) ----
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfToday.getDate() + 1);

  const startIn7Days = new Date(startOfToday);
  startIn7Days.setDate(startOfToday.getDate() + 7);

  const isToday = date >= startOfToday && date < startOfTomorrow;
  const isNextWeek = date >= startOfTomorrow && date < startIn7Days;

  // days from *today* (0=today, 1=tomorrow, …)
  const daysDiff = Math.max(0, Math.ceil((date.getTime() - startOfToday.getTime()) / 86_400_000));

  const formattedTime = date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const formatDateLabel = () => {
    if (isToday) return "Today";
    if (daysDiff === 1) return "Tomorrow";
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative flex flex-col items-center w-full p-4 rounded-xl shadow-md hover:shadow-lg bg-white">


      {/* Bottom-left status badge */}
      {isToday && (
        <span className="absolute bottom-2 left-2 z-10 text-xs font-bold text-white bg-red-400 px-2 py-0.5 rounded-md animate-blink">
          today
        </span>
      )}
      {isNextWeek && (
        <span className="absolute bottom-2 left-2 z-10 text-xs font-semibold text-white bg-orange-900 px-2 py-0.5 rounded-md">
          in {daysDiff} days
        </span>
      )}

      {/* Top-left checkbox */}
      <input
        type="checkbox"
        className="absolute top-3 left-3 w-5 h-5 accent-2 bg-accent-2 rounded cursor-pointer z-10"
        checked={isSelected}
        onChange={onToggle}
      />

      {/* Top: League and Date */}
      <div className="text-sm text-gray-600 mb-2 text-center">
        {leagueName && (<><span className="font-medium">{leagueName}</span><span className="mx-2">·</span></>)}
        <span>{formatDateLabel()}, {formattedTime}</span>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between w-full px-4">
        <TeamInfo name={homeTeam.name} logoId={homeTeam.logoId} />
        <span className="text-base font-semibold text-gray-700 px-4">vs</span>
        <TeamInfo name={awayTeam.name} logoId={awayTeam.logoId} />
      </div>

      {/* Round info */}
      {round && (
        <div className="mt-3 text-sm text-gray-500 text-center">
          {round}
        </div>
      )}
    </div>
  );
}

function TeamInfo({ name, logoId }: { name: string; logoId: string }) {
  const svg = `../assets/logos/team/${logoId}.svg`;
  const png = `../assets/logos/team/${logoId}.png`;
  const logo = logos[svg] || logos[png];

  return (
    <div className="flex flex-col items-center text-center w-1/3">
      {logo && <img src={logo} alt={name} className="w-12 h-12 object-contain mb-1" />}
      <span className="text-sm font-bold text-gray-700 truncate">{name}</span>
    </div>
  );
}
