import { type Entity } from "./api.interface";

type EntityType = "country" | "league" | "team" | "game";


export type GameEntity = {
    id: string;
    name: string;
    type: 'game';
    date: string;
    homeTeamId: number;
    homeTeamName: string;
    awayTeamId: number;
    awayTeamName: string;
    league: string;
    round: string;
  };
  
 export type EntityData = {
    country: Entity[];
    league: Entity[];
    team: Entity[];
    game: (Entity | GameEntity)[];
  };
  
  
export  type BasicEntity = {
    id: string;
    name: string;
    type: EntityType;
    description?: string;
  };
  
export type GameOnlyResult = {
    country: Entity[];
    league: Entity[];
    team: Entity[];
    game: GameEntity[];
  };
  
  
export type FullResult = {
    country: Entity[];
    league: Entity[];
    team: Entity[];
    game: never[];
  };
  

  