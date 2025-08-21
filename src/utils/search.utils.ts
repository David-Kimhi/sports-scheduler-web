// ──────────────────────────────────────────────────────────────────────────────
// File: src/utils/search.utils.ts
// 
// utils for the search page
// ──────────────────────────────────────────────────────────────────────────────
import type { Entity } from "../interfaces/api.interface";
import type { EntityData } from "../interfaces/entityTypes.interface";
import type { GameApi, LeagueApi, CountryApi, TeamApi } from "../interfaces/api.interface";

export type SearchApiResponse = {
    fixtures?: GameApi[];
    countries?: CountryApi[];
    leagues?: LeagueApi[];
    teams?: TeamApi[];
  };

export const dedupeById = <T extends Entity>(arr: T[]) => {
  const seen = new Set<string>();
  return arr.filter((x) => {
    const key = `${x.type}:${String(x.id)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const pinSelected = (type: Entity["type"], active: Entity[], items: Entity[]) => {
  const activesOfType = active.filter((f) => f.type === type);
  return dedupeById<Entity>([...activesOfType, ...items]);
};

export function buildParams({
  query,
  filters,
  games,
}: {
  query: string;
  filters: Entity[];
  games?: boolean;
}) {
  const params = new URLSearchParams();
  if (query && !games) params.append("word", query);

  for (const f of filters) {
    if (f.id != null) params.append(f.type, String(f.id));
  }

  if (games) {
    params.append("games", "true");
    params.append("limit", "100");
  }

  return params;
}

export function mapSearchResults(
  data: SearchApiResponse,
  { games, selectedTeamIds }: { games?: boolean; selectedTeamIds: string[] }
): EntityData {
  if (games) {
    const fixtures: GameApi[] = data.fixtures ?? [];
    return {
      country: [],
      league: [],
      team: [],
      game: fixtures.map((g) => ({
        id: g.id,
        name: `${g.home} vs ${g.away}`,
        type: "game" as const,
        date: typeof g.date === "string" ? g.date : g.date.toISOString(),
        homeTeamId: Number(g.home_id),
        homeTeamName: g.home,
        awayTeamId: Number(g.away_id),
        awayTeamName: g.away,
        round: g.round,
        league: g.league,
        venueCity: g.venueCity,
        venueName: g.venueName,
        selectedTeamIds,
      })),
    } satisfies EntityData;
  }

  const countries: CountryApi[] = data.countries ?? [];
  const leagues: LeagueApi[] = data.leagues ?? [];
  const teams: TeamApi[] = data.teams ?? [];

  return {
    country: countries.map((c) => ({ id: c.code, name: c.name, type: "country" as const })),
    league: leagues.map((l) => ({
      id: l.id,
      name: l.name,
      type: "league" as const,
      description: `A ${l.type} in ${l.country}`,
    })),
    team: teams.map((t) => ({
      id: t.id,
      name: t.name,
      type: "team" as const,
      description: `A Team in ${t.country}`,
    })),
    game: [],
  } satisfies EntityData;
}
