
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
}

interface GameApi {
    id: string;
    name: string;
    date: Date;
}

interface Entity {
    id: string;
    name: string;
    type: EntityType;
    description?: string;  
    logo?: string;      
}

export {type CountryApi, type LeagueApi, type TeamApi, type GameApi, type Entity, type EntityType}
  