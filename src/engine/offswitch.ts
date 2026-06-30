import type {
  Player,
  OffSwitchOutcome,
  WorldEvent,
  LayerId,
  ExposureKind,
  FragilityMark,
} from "../data/types";
import { OPTION_BY_ID } from "../data/layers";

export interface ExposedLayer {
  layer: LayerId;
  exposure: ExposureKind;
  optionId: string;
}

/** Which of a player's picks are exposed to the off-switch, accounting for deals/assets. */
export function exposedLayers(player: Player): ExposedLayer[] {
  const out: ExposedLayer[] = [];
  for (const [layer, optionIds] of Object.entries(player.picks)) {
    for (const optionId of optionIds ?? []) {
      const opt = OPTION_BY_ID[optionId];
      if (!opt || opt.exposure === "none") continue;

      // OSS Commons is immune at L4 (the weights are already everywhere).
      if (player.regionId === "oss-commons" && opt.layer === "weights") continue;

      // Nvidia-direct is only exposed if you DON'T have a secured supply deal / ASML.
      if (opt.exposure === "nvidia-no-deal") {
        const secured =
          player.unlocks.includes("supply-allocation") || player.assets.includes("asml-token");
        if (secured) continue;
      }

      out.push({ layer: layer as LayerId, exposure: opt.exposure, optionId });
    }
  }
  return out;
}

export interface OffSwitchResult {
  playerId: string;
  spared: boolean;
  falseAlarmFlags: ExposedLayer[]; // flagged but not damaged
  damaged: ExposedLayer[];
  newMarks: FragilityMark[];
  adoptionLost: number; // this round's adoption shave (flavor / animation)
}

export function resolveOffSwitch(
  player: Player,
  outcome: OffSwitchOutcome,
  round: number,
  event?: WorldEvent,
): OffSwitchResult {
  const exposed = exposedLayers(player);
  const expBonus = event?.effects.some((e) => e.kind === "exposure-bonus") ? 1 : 0;

  if (outcome.falseAlarm) {
    return {
      playerId: player.id,
      spared: true,
      falseAlarmFlags: exposed,
      damaged: [],
      newMarks: [],
      adoptionLost: 0,
    };
  }

  const targeted = exposed.filter((e) => outcome.hits.includes(e.exposure));
  if (targeted.length === 0) {
    return {
      playerId: player.id,
      spared: true,
      falseAlarmFlags: [],
      damaged: [],
      newMarks: [],
      adoptionLost: 0,
    };
  }

  const newMarks: FragilityMark[] = targeted.map((t) => ({
    layer: t.layer,
    round,
    outcome: outcome.id,
  }));

  // Capital-flight exposure bonus: one extra scar if you leaned on rented/foreign.
  if (expBonus > 0) {
    newMarks.push({ layer: targeted[0].layer, round, outcome: outcome.id });
  }

  const adoptionLost = targeted.reduce((acc, t) => {
    const opt = OPTION_BY_ID[t.optionId];
    const slash = outcome.broad ? opt.adoption * outcome.damage : opt.adoption;
    return acc + slash;
  }, 0);

  return {
    playerId: player.id,
    spared: false,
    falseAlarmFlags: [],
    damaged: targeted,
    newMarks,
    adoptionLost: Math.round(adoptionLost),
  };
}
