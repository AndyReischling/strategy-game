import type { Deal, Player, ScoreBreakdown, LayerOption, OptionTag } from "../data/types";
import { OPTION_BY_ID } from "../data/layers";
import { CONFIG } from "../data/config";

function pickedOptions(player: Player): LayerOption[] {
  return (Object.values(player.picks).filter(Boolean) as string[])
    .map((id) => OPTION_BY_ID[id])
    .filter(Boolean);
}

function has(opts: LayerOption[], tag: OptionTag): boolean {
  return opts.some((o) => o.tags.includes(tag));
}
function hasId(opts: LayerOption[], id: string): boolean {
  return opts.some((o) => o.id === id);
}

interface CoherenceResult {
  multiplier: number;
  notes: string[];
}

export function computeCoherence(opts: LayerOption[]): CoherenceResult {
  const notes: string[] = [];
  let synergy = 0;
  let clash = 0;

  const openWeights = opts.some((o) => o.layer === "weights" && o.tags.includes("open"));
  const adaptModel = has(opts, "finetune") || has(opts, "continued") || has(opts, "localize");
  const sovereignCompute = opts.some((o) => o.layer === "compute" && o.tags.includes("sovereign"));
  const ownedWeights = opts.some((o) => o.layer === "weights" && o.tags.includes("owned"));
  const sovereignHosting = opts.some((o) => o.layer === "hosting" && o.tags.includes("sovereign"));
  const smallCompute = has(opts, "small-compute");

  // Synergies
  if (openWeights && adaptModel) {
    synergy++;
    notes.push("✦ Open base + adapt it — a tight, cheap fit.");
  }
  if (openWeights && has(opts, "open-ecosystem")) {
    synergy++;
    notes.push("✦ Open weights feed an open developer platform.");
  }
  if (sovereignCompute && ownedWeights && sovereignHosting) {
    synergy++;
    notes.push("✦ Sovereign top-to-bottom — nothing to switch off.");
  }
  if (has(opts, "on-device") && smallCompute) {
    synergy++;
    notes.push("✦ Lean compute matches on-device delivery.");
  }
  if (
    has(opts, "localize") &&
    (has(opts, "consumer-app") || has(opts, "consumer-market") || has(opts, "public-sector"))
  ) {
    synergy++;
    notes.push("✦ A local model meeting local distribution.");
  }

  // Clashes
  if (has(opts, "pretrain-scratch") && smallCompute) {
    clash++;
    notes.push("✕ Frontier ambitions on academic-scale compute.");
  }
  if (hasId(opts, "m-wrap-closed") && hasId(opts, "h-sovereign-hosted")) {
    clash++;
    notes.push("✕ Trust-audit hosting wrapped around a rented brain.");
  }
  const rentedWeights = opts.some((o) => o.layer === "weights" && o.tags.includes("rented"));
  if (rentedWeights && has(opts, "open-ecosystem")) {
    clash++;
    notes.push("✕ You can't open-source what you only rent.");
  }
  const foreignCompute = opts.some((o) => o.layer === "compute" && o.tags.includes("foreign"));
  if (foreignCompute && sovereignHosting) {
    clash++;
    notes.push("✕ A sovereign storefront on a foreign basement.");
  }

  const { base, perSynergy, perClash, min, max } = CONFIG.coherence;
  const raw = base + perSynergy * synergy - perClash * clash;
  const multiplier = Math.max(min, Math.min(max, raw));
  return { multiplier, notes };
}

export function computeSovereignty(opts: LayerOption[]): { multiplier: number; fraction: number } {
  if (opts.length === 0) return { multiplier: 1, fraction: 0 };
  const sum = opts.reduce((acc, o) => acc + o.sovereignty, 0);
  const fraction = Math.max(-1, Math.min(1, sum / (opts.length * 3)));
  const { min, max } = CONFIG.sovereignty;
  const multiplier = min + ((fraction + 1) / 2) * (max - min);
  return { multiplier, fraction };
}

export function computeDeals(
  player: Player,
  deals: Deal[],
  dealBonusPerDeal = 0,
): { points: number; notes: string[] } {
  const notes: string[] = [];
  let points = 0;
  const { swapPoints, accessPoints, assetPoints, standingMultiplier, gapFillBonus } = CONFIG.deals;

  for (const d of deals) {
    if (!d.active || d.broken) continue;
    if (d.fromPlayerId !== player.id && d.toPlayerId !== player.id) continue;

    let p =
      d.kind === "access" ? accessPoints : d.kind === "asset" ? assetPoints : swapPoints;
    if (d.kind === "standing") {
      // standing wraps an underlying favor; weight by what it does
      p = (d.terms.grantsPrecondition ? accessPoints : assetPoints) * 1;
      p *= standingMultiplier;
    } else if (d.standing) {
      p *= standingMultiplier;
    }

    const fillsGap = d.terms.fillsGap || !!d.terms.grantsPrecondition;
    if (fillsGap && d.toPlayerId === player.id) p += gapFillBonus;

    p += dealBonusPerDeal;
    points += p;
  }

  if (points > 0) notes.push(`+${Math.round(points)} from ${deals.filter((d) => d.active && (d.fromPlayerId === player.id || d.toPlayerId === player.id)).length} active deal(s).`);
  return { points: Math.round(points), notes };
}

export function computeScore(
  player: Player,
  deals: Deal[],
  opts: { dealBonusPerDeal?: number } = {},
): ScoreBreakdown {
  const picks = pickedOptions(player);
  const rawAdoption = picks.reduce((acc, o) => acc + o.adoption, 0);

  // Interdependence gate: a stack only reaches users as well as it is complete.
  // Every empty layer caps the WHOLE stack, so balance beats grabbing the
  // biggest individual numbers.
  const builtLayers = picks.length;
  const reach = builtLayers === 0
    ? 0
    : Math.min(1, Math.max(CONFIG.reach.floor, CONFIG.reach.perLayer * builtLayers));

  const coh = computeCoherence(picks);
  const sov = computeSovereignty(picks);
  const dealRes = computeDeals(player, deals, opts.dealBonusPerDeal ?? 0);

  const fragilityPenalty = player.fragility.length * CONFIG.offSwitch.fragilityPenaltyPerMark;

  // Reward a war chest kept on hand (dry powder for deals / resilience).
  const capital = Math.round(player.credits * CONFIG.capital.perB * 10) / 10;

  const final =
    rawAdoption * reach * coh.multiplier * sov.multiplier + dealRes.points + capital - fragilityPenalty;

  const notes: string[] = [
    ...coh.notes,
    ...dealRes.notes,
  ];
  if (builtLayers > 0 && builtLayers < 5) {
    notes.push(`✕ Only ${builtLayers}/5 layers built — your stack reaches just ${Math.round(reach * 100)}% of its potential users. Complete the chain.`);
  } else if (builtLayers === 5) {
    notes.push("✦ Full five-layer stack — every part of the chain is in place.");
  }
  if (sov.fraction >= 0.5) notes.push("✦ Highly sovereign — the off-switch barely touches you.");
  if (sov.fraction <= -0.3) notes.push("✕ Heavily dependent — exposed to the off-switch.");
  if (capital > 0) notes.push(`✦ +${capital} from capital kept in reserve.`);
  if (player.fragility.length) notes.push(`✕ ${player.fragility.length} fragility mark(s) from off-switch hits.`);

  return {
    rawAdoption,
    reach,
    coherence: coh.multiplier,
    sovereignty: sov.multiplier,
    deals: dealRes.points,
    capital,
    fragilityPenalty,
    final: Math.max(0, Math.round(final * 10) / 10),
    notes,
  };
}
