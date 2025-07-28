import { format } from "date-fns";
import { logos } from '../config';

interface GameCardProps {
  homeTeam: { name: string; logoId: string };
  awayTeam: { name: string; logoId: string };
  dateUTC: string;
}

export function GameCard({ homeTeam, awayTeam, dateUTC }: GameCardProps) {
    const date = new Date(dateUTC);
    const formattedDate = format(date, "dd 'of' MMMM yyyy, HH:mm");
  
    const homeLogo = logos[`../assets/logos/team/${homeTeam.logoId}.svg`] || logos[`../assets/logos/team/${homeTeam.logoId}.png`];
    const awayLogo = logos[`../assets/logos/team/${awayTeam.logoId}.svg`] || logos[`../assets/logos/team/${awayTeam.logoId}.png`];
  
    return (
      <div className="p-4 rounded-xl shadow-md bg-white flex flex-col items-center gap-2 w-full max-w-[320px]">
        <div className="flex justify-between items-end w-full">
          {/* Home Team */}
          <div className="flex flex-col items-center flex-1">
            {homeLogo && <img src={homeLogo} alt={homeTeam.name} className="w-8 h-8 mb-1"/>}
            <span className="font-bold text-gray-800 text-sm truncate max-w-[100px]">{homeTeam.name}</span>
          </div>
  
          {/* VS */}
          <div className="mx-4 text-lg font-bold text-gray-500 self-center">vs</div>
  
          {/* Away Team */}
          <div className="flex flex-col items-center flex-1">
            {awayLogo && <img src={awayLogo} alt={awayTeam.name} className="w-8 h-8 mb-1" />}
            <span className="font-bold text-gray-800 text-sm truncate max-w-[100px]">{awayTeam.name}</span>
          </div>
        </div>
  
        {/* Event date */}
        <div className="text-gray-600 text-sm font-medium text-center">{formattedDate}</div>
      </div>
    );
  }
  