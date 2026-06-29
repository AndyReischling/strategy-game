// ─────────────────────────────────────────────────────────────────────────
// GLOBAL TUNABLES (§4, §6, §7). One place to balance the whole game.
// ─────────────────────────────────────────────────────────────────────────

export const CONFIG = {
  startingBudget: 20, // §20 Credits, equal for everyone (§4)
  perRoundStipend: 0, // optional small income; default off (§4)
  totalRounds: 5,
  maxPlayersPerTable: 6,
  switchingCostPenalty: 1, // changing a locked pick costs this (§6 step 3)

  // Off-switch die (§6 step 5)
  offSwitch: {
    triggerMin: 4, // on 4–6 the adversary's move lands
    baseDamage: 1.0, // exposed layer's adoption contribution slashed fully for the round
    fragilityPenaltyPerMark: 1.5, // permanent score dent per fragility mark
  },

  // Scoring multipliers (§7)
  coherence: {
    min: 0.7,
    max: 1.3,
    base: 1.0,
    perSynergy: 0.1,
    perClash: 0.12,
  },
  sovereignty: {
    min: 0.6,
    max: 1.25,
    // maps normalized sovereignty fraction (-1..1) into [min..max]
  },
  deals: {
    swapPoints: 1,
    accessPoints: 3, // unlocking a precondition is worth most
    assetPoints: 2,
    standingMultiplier: 1.6, // standing deals worth more
    gapFillBonus: 2, // a deal that fills a real gap
    breakPenalty: 3, // both sides lose this if a standing deal breaks
  },
};

// Player spot-color assignment order for a table (overrides region color clashes).
export const SEAT_COLORS = ["blue", "orange", "green", "yellow", "violet", "teal"] as const;
