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
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const formatDateLabel = () => {
    const isToday =
      date.toDateString() === now.toDateString();
    const isTomorrow =
      date.toDateString() === tomorrow.toDateString();

    if (isToday) return "Today";
    if (isTomorrow) return "Tomorrow";

    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formattedTime = date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <div className="relative flex flex-col items-center w-full p-4 rounded-xl shadow-md hover:shadow-lg bg-game-card">
        {/* Top-left checkbox */}
        <input
            type="checkbox"
            className="absolute top-3 left-3 w-5 h-5 accent-2 bg-accent-2 rounded cursor-pointer z-10"
            checked={isSelected}
            onChange={onToggle}
        />   

        {/* Top: League and Date */}
        <div className="text-sm text-gray-600 mb-2 text-center">
            {leagueName && (
            <>
                <span className="font-medium">{leagueName}</span>
                <span className="mx-2">·</span>
            </>
            )}
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

      {/* Optional bottom row (you can customize more here) */}
      {/* <div className="mt-2 text-sm text-gray-500 text-center">
        Second qualifying round · Leg 2 of 2<br />
        Aggregate: 0 - 1
      </div> */}
    </div>
  );
}

function TeamInfo({
    name,
    logoId,
  }: {
    name: string;
    logoId: string;
  }) {
    const svg = `../assets/logos/team/${logoId}.svg`;
    const png = `../assets/logos/team/${logoId}.png`;
    const logo = logos[svg] || logos[png];
  
    return (
      <div className="flex flex-col items-center text-center w-1/3">
        {logo && (
          <img
            src={logo}
            alt={name}
            className="w-12 h-12 object-contain mb-1"
          />
        )}
        <span className="text-sm font-bold text-gray-700 truncate">{name}</span>
      </div>
    );
  }
  
