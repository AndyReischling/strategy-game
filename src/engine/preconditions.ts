import type { Player, LayerOption, Precondition } from "../data/types";
import { OPTION_BY_ID } from "../data/layers";

/** Preconditions a region satisfies on its own, from its Powers/Assets. */
export function regionInherentUnlocks(regionId: string): Precondition[] {
  switch (regionId) {
    case "france":
      return ["high-power", "political-standing"];
    case "nordics":
      return ["renewable-power"];
    case "uk":
      return ["renewable-power"];
    case "germany":
      return ["market-channel", "political-standing"];
    case "india":
      return ["market-channel"];
    case "canada":
      return ["political-standing"];
    case "oss-commons":
      return ["open-weights", "political-standing", "oss-grant"];
    case "netherlands":
      return ["asml-token", "supply-allocation"];
    default:
      return [];
  }
}

export interface BuildCheck {
  ok: boolean;
  /** short label explaining what's needed */
  needs?: string;
  /** is it the kind of gap a deal fills? */
  dealable?: boolean;
}

const NEEDS_LABEL: Record<Precondition, string> = {
  none: "",
  "supply-allocation": "a chip supply allocation (deal, or the ASML token)",
  "deal-compute": "a compute-holder to grant cluster access",
  "high-power": "a strong domestic power base (deal, or a power region)",
  "renewable-power": "a cold / renewable-power base (deal, or Nordics/UK)",
  "open-weights": "an open Layer-4 base chosen or granted",
  "closed-partner": "an ongoing closed-API rental",
  "asml-token": "the ASML token",
  "co-funders-2": "≥2 co-funders committed (coalition deal)",
  "co-funder-1": "≥1 partner committed (shared-build deal)",
  "market-channel": "a market-channel grant (Germany / India / a market region)",
  "political-standing": "enough political standing (deal, or a high-standing region)",
  "oss-grant": "an OSS Commons player at the table, willing to grant",
};

/** Does this player already satisfy `req` (and could therefore grant it in a deal)? */
export function playerCanGrant(p: Player, req: Precondition): boolean {
  if (req === "none") return false;
  if (req === "asml-token") return p.assets.includes("asml-token");
  if (req === "supply-allocation")
    return p.assets.includes("asml-token") || p.unlocks.includes(req) || regionInherentUnlocks(p.regionId).includes(req);
  return p.unlocks.includes(req) || regionInherentUnlocks(p.regionId).includes(req);
}

export function canBuild(player: Player, option: LayerOption): BuildCheck {
  const req = option.requires;
  if (req === "none") return { ok: true };

  const inherent = regionInherentUnlocks(player.regionId);
  const unlocked = player.unlocks.includes(req) || inherent.includes(req);

  switch (req) {
    case "closed-partner":
      // The American incumbent will always rent you the closed API — that's the trap.
      return { ok: true };
    case "open-weights": {
      const ownOpen = !!player.picks.weights && OPTION_BY_ID[player.picks.weights]?.tags.includes("open");
      if (ownOpen || unlocked) return { ok: true };
      return { ok: false, needs: NEEDS_LABEL[req], dealable: true };
    }
    case "asml-token":
      if (player.assets.includes("asml-token")) return { ok: true };
      return { ok: false, needs: NEEDS_LABEL[req], dealable: true };
    case "supply-allocation":
      if (unlocked || player.assets.includes("asml-token")) return { ok: true };
      return { ok: false, needs: NEEDS_LABEL[req], dealable: true };
    case "market-channel":
      if (unlocked) return { ok: true };
      return { ok: false, needs: NEEDS_LABEL[req], dealable: true };
    default:
      if (unlocked) return { ok: true };
      return { ok: false, needs: NEEDS_LABEL[req], dealable: true };
  }
}
