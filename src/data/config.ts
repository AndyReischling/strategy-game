// ─────────────────────────────────────────────────────────────────────────
// GLOBAL TUNABLES (§4, §6, §7). One place to balance the whole game.
// ─────────────────────────────────────────────────────────────────────────

// All currency is in BILLIONS OF US DOLLARS. Internally a value of 100 = $100B;
// the UI renders it as "$100B". Costs are tuned to feel like the real capital /
// infrastructure bills (frontier training runs, mega-clusters, chip allocations).
export const CONFIG = {
  startingBudget: 100, // $100B, equal for everyone
  perRoundStipend: 0, // optional small income; default off
  totalRounds: 10,
  maxPlayersPerTable: 6,
  switchingCostPenalty: 3, // changing a locked pick costs $3B

  // Off-switch die (§6 step 5)
  offSwitch: {
    triggerMin: 4, // on 4–6 the adversary's move lands
    baseDamage: 1.0, // exposed layer's adoption contribution slashed fully for the round
    fragilityPenaltyPerMark: 1.5, // permanent score dent per fragility mark
  },

  // Scoring multipliers (§7). Widened so the multipliers — not the raw adoption
  // sum — decide the winner: a coherent, sovereign stack should beat a higher-
  // adoption incoherent/dependent one.
  coherence: {
    min: 0.55,
    max: 1.5,
    base: 1.0,
    perSynergy: 0.13,
    perClash: 0.16,
  },
  sovereignty: {
    min: 0.45,
    max: 1.5,
    // maps normalized sovereignty fraction (-1..1) into [min..max]
  },

  // Reach gate (interdependence): realized adoption = rawAdoption × reach, where
  // reach grows with how complete your stack is. Every empty layer caps the
  // WHOLE stack's reach — a chain is only as strong as its weakest link, so you
  // can't just grab the biggest individual numbers and ignore the rest.
  reach: {
    perLayer: 0.2, // each of the 5 built layers adds 0.2 → a full stack reaches 1.0
    floor: 0.15, // a lone layer still reaches a sliver of users
  },
  deals: {
    swapPoints: 1,
    accessPoints: 3, // unlocking a precondition is worth most
    assetPoints: 2,
    standingMultiplier: 1.6, // standing deals worth more
    gapFillBonus: 2, // a deal that fills a real gap
    breakPenalty: 5, // $B both sides lose if a standing deal breaks
  },

  // Reward capital kept on hand at scoring — a war chest is strategic value
  // (dry powder for deals, resilience), so don't blow every dollar.
  capital: {
    perB: 0.1, // score points per $1B of unspent credits
  },
};

// Player spot-color assignment order for a table (overrides region color clashes).
export const SEAT_COLORS = ["blue", "orange", "green", "yellow", "violet", "teal"] as const;
