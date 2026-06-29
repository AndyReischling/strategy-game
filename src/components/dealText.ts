import type { Deal, TableState, Precondition } from "../data/types";
import { credits } from "./util";

export const ASSET_LABEL: Record<string, string> = {
  "asml-token": "ASML token", "mistral-license": "Mistral license", "cohere-license": "Cohere license",
  "nscale-capacity": "Nscale capacity", "enterprise-channel": "Enterprise channel", "consumer-channel": "Consumer channel",
  "open-weights-grant": "Open-weights grant", "renewable-sites": "Renewable sites", "chip-allocation": "Chip allocation",
  "swf-financing": "SWF financing", "industrial-demand": "Industrial demand",
};

export const PRECOND_LABEL: Partial<Record<Precondition, string>> = {
  "deal-compute": "Cluster access (compute)",
  "supply-allocation": "Chip supply allocation",
  "high-power": "High-power base",
  "renewable-power": "Renewable-power base",
  "open-weights": "Open weights (free L4)",
  "market-channel": "Market channel (L5 reach)",
  "political-standing": "Political cover / standing",
  "co-funder-1": "Shared-build commitment",
  "co-funders-2": "Coalition co-funder",
  "oss-grant": "OSS open-weights grant",
};

/** Plain one-line description of a deal's terms. */
export function summarizeDeal(d: Deal, table: TableState): string {
  const from = table.players.find((p) => p.id === d.fromPlayerId);
  const t = table.players.find((p) => p.id === d.toPlayerId);
  const parts: string[] = [];
  const c = d.terms.creditsFromTo ?? 0;
  if (c > 0) parts.push(`${from?.name} pays ${credits(c)} → ${t?.name}`);
  if (c < 0) parts.push(`${t?.name} pays ${credits(-c)} → ${from?.name}`);
  if (d.terms.assetId) parts.push(`${d.terms.lease ? "leases" : "sells"} ${ASSET_LABEL[d.terms.assetId] ?? d.terms.assetId}`);
  if (d.terms.grantsPrecondition) parts.push(`unlocks ${PRECOND_LABEL[d.terms.grantsPrecondition] ?? d.terms.grantsPrecondition}`);
  if (d.terms.investorCut) parts.push(`${from?.name} backs ${t?.name} for ${Math.round(d.terms.investorCut * 100)}% of their score`);
  return parts.join(" · ") || "a favor";
}
