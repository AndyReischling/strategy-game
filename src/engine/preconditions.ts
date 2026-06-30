import type { Player, LayerOption, Precondition, AssetId, StrengthDim } from "../data/types";
import { OPTION_BY_ID } from "../data/layers";
import { REGION_BY_ID } from "../data/regions";

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

// Assets whose holder can grant a precondition to a partner (they actually
// control the thing being unlocked).
const ASSET_GRANTS: Partial<Record<AssetId, Precondition[]>> = {
  "asml-token": ["asml-token", "supply-allocation"],
  "chip-allocation": ["supply-allocation"], // Japan/Korea's politically-safe chip pool
  "nscale-capacity": ["deal-compute"], // leasable sovereign GPU capacity
  "renewable-sites": ["renewable-power", "deal-compute"], // green data-center sites
  "enterprise-channel": ["market-channel"],
  "consumer-channel": ["market-channel"],
  "industrial-demand": ["market-channel"],
  "open-weights-grant": ["open-weights", "oss-grant"],
};

// A region that is structurally strong in a dimension can supply it.
const STRENGTH_GRANTS: Partial<Record<Precondition, StrengthDim>> = {
  "supply-allocation": "chips",
  "deal-compute": "compute",
  "market-channel": "market",
};

/** Can this player actually grant `req` to a partner — from their region, assets, or structural strength? */
export function playerCanGrant(p: Player, req: Precondition): boolean {
  if (req === "none" || req === "closed-partner") return false;
  // A shared-build / coalition commitment is a promise any partner can make.
  if (req === "co-funder-1" || req === "co-funders-2") return true;
  // The region's own inherent strengths (nuclear power, market, standing, …).
  if (regionInherentUnlocks(p.regionId).includes(req)) return true;
  // An asset the player holds that confers the ability to grant.
  for (const a of p.assets) {
    if (ASSET_GRANTS[a]?.includes(req)) return true;
  }
  // A structurally strong region can supply what it's strong in.
  const dim = STRENGTH_GRANTS[req];
  if (dim && (REGION_BY_ID[p.regionId]?.strengths[dim] ?? 0) >= 2) return true;
  return false;
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
      const ownOpen = (player.picks.weights ?? []).some((id) => OPTION_BY_ID[id]?.tags.includes("open"));
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
