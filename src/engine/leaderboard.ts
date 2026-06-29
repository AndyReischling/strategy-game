import type { TableState, LeaderboardRow } from "../data/types";
import { REGION_BY_ID } from "../data/regions";

export function tableRows(table: TableState): LeaderboardRow[] {
  return table.players
    .filter((p) => p.ready)
    .map((p) => {
      const region = REGION_BY_ID[p.regionId];
      return {
        playerId: p.id,
        table: table.code,
        name: p.name,
        regionId: p.regionId,
        regionName: region?.name ?? "—",
        flag: region?.flag ?? "🏳️",
        color: p.color,
        score: p.score.final,
      };
    });
}

export function buildLeaderboard(tables: TableState[]): LeaderboardRow[] {
  return tables
    .flatMap(tableRows)
    .sort((a, b) => b.score - a.score);
}
