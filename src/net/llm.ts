import type { Player } from "../data/types";
import { REGION_BY_ID } from "../data/regions";
import { OPTION_BY_ID } from "../data/layers";
import { computeCoherence, computeSovereignty } from "../engine/scoring";

// Client helpers for the optional Claude-backed features. Everything degrades
// gracefully: if the LLM isn't enabled or a call fails, callers fall back to the
// deterministic engine behavior, so the game always works.

export function llmEnabled(): boolean {
  return import.meta.env.VITE_LLM_ENABLED === "true";
}

export interface LlmStatus {
  enabled: boolean;
  keyPresent: boolean;
  model?: string;
}

/** Is the AI on, and is the server key actually set? Cheap probe (no LLM call). */
export async function checkLlm(): Promise<LlmStatus> {
  if (!llmEnabled()) return { enabled: false, keyPresent: false };
  try {
    const res = await fetch("/api/health");
    if (!res.ok) return { enabled: true, keyPresent: false };
    const j = (await res.json()) as { keyPresent?: boolean; model?: string };
    return { enabled: true, keyPresent: !!j.keyPresent, model: j.model };
  } catch {
    return { enabled: true, keyPresent: false };
  }
}

/** Compact, model-friendly description of a player's stack for the VC. */
export function stackSummary(player: Player) {
  const region = REGION_BY_ID[player.regionId];
  const opts = Object.values(player.picks)
    .flatMap((arr) => arr ?? [])
    .map((id) => OPTION_BY_ID[id])
    .filter(Boolean);
  const sov = computeSovereignty(opts);
  const coh = computeCoherence(opts).multiplier;
  return {
    region: region?.name ?? "—",
    layersBuilt: opts.length,
    picks: opts.map((o) => `${o.layer}: ${o.name}`),
    credits: player.credits,
    sovereignty: Math.round(sov.fraction * 100) / 100,
    coherence: Math.round(coh * 100) / 100,
    raisesUsed: player.raisesUsed,
  };
}

export interface PitchVerdict {
  funded: boolean;
  amount: number;
  reason: string;
}

export async function judgePitch(pitch: string, stack: unknown): Promise<PitchVerdict | null> {
  if (!llmEnabled()) return null;
  try {
    const res = await fetch("/api/pitch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pitch, stack }),
    });
    if (!res.ok) return null;
    const j = (await res.json()) as Partial<PitchVerdict>;
    if (typeof j.funded !== "boolean") return null;
    return { funded: j.funded, amount: Number(j.amount) || 0, reason: String(j.reason ?? "") };
  } catch {
    return null;
  }
}

export type EventFlavor = Record<string, { name: string; flavor: string; effectText: string }>;

export async function generateEventFlavor(
  cards: { id: string; name: string; effectText: string }[],
): Promise<EventFlavor | null> {
  if (!llmEnabled()) return null;
  try {
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ cards }),
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { flavor?: EventFlavor };
    return j.flavor && Object.keys(j.flavor).length ? j.flavor : null;
  } catch {
    return null;
  }
}
