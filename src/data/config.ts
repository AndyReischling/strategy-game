// ─────────────────────────────────────────────────────────────────────────
// GLOBAL TUNABLES (§4, §6, §7). One place to balance the whole game.
// ─────────────────────────────────────────────────────────────────────────

// All currency is in BILLIONS OF US DOLLARS. Internally a value of 100 = $100B;
// the UI renders it as "$100B". Costs are tuned to feel like the real capital /
// infrastructure bills (frontier training runs, mega-clusters, chip allocations).
export const CONFIG = {
  startingBudget: 100, // $100B, equal for everyone
  perRoundStipend: 0, // optional small income; default off
  totalRounds: 5,
  maxPlayersPerTable: 6,
  switchingCostPenalty: 3, // changing a locked pick costs $3B

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
    breakPenalty: 5, // $B both sides lose if a standing deal breaks
  },
};

// Player spot-color assignment order for a table (overrides region color clashes).
export const SEAT_COLORS = ["blue", "orange", "green", "yellow", "violet", "teal"] as const;
