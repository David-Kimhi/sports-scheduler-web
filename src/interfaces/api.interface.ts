
type EntityType = "country" | "league" | "team" | "game";

interface CountryApi {
    code: string;
    name: string;
  }
  
interface LeagueApi {
    id: string;
    name: string;
    country: string;
    type: string;
}

interface TeamApi {
    id: string;
    name: string;
    country: string;
}

interface GameApi {
    id: string;
    name: string;
    date: Date;
    home: string;
    away: string;
    home_id: number;
    away_id: number;
}

interface Entity {
    id: string | number;
    name: string;
    type: "country" | "league" | "team" | "game";
    description?: string;
  
    // Game-specific fields (only used when type === "game")
    date?: string;
    homeTeamId?: string | number;
    homeTeamName?: string;
    awayTeamId?: string | number;
    awayTeamName?: string;
  }
  

export {type CountryApi, type LeagueApi, type TeamApi, type GameApi, type Entity, type EntityType}
  