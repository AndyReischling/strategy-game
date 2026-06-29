import type { WorldEvent, OffSwitchOutcome } from "./types";

// ─── 12a. World-event deck (12 cards; 5 seeded per game) ───────────────────
export const WORLD_EVENTS: WorldEvent[] = [
  {
    id: "ev-nvidia-toll",
    name: "Nvidia Toll Booth",
    flavor: "Every road to the frontier runs through one company's gate — and the toll just went up.",
    effectText: "All Nvidia-based options cost +$3B. The ASML token holder profits as the gatekeeper.",
    effects: [
      { kind: "surcharge-tag", tags: ["nvidia"], amount: 3 },
    ],
    terms: ["nvidia", "asml"],
  },
  {
    id: "ev-cost-gap",
    name: "The Cost Gap Bites",
    flavor: "A datacenter on European soil still costs a third more than the same racks in Texas. The bill came due.",
    effectText: "All build-your-own compute options cost +$3B. Renting suddenly looks tempting — the trap.",
    effects: [
      { kind: "surcharge-tag", tags: ["domestic-build"], amount: 3 },
    ],
  },
  {
    id: "ev-energy-crunch",
    name: "Energy Crunch",
    flavor: "The grid groaned. Ministers chose between cooling the server halls and heating the houses.",
    effectText: "Non-renewable compute builds cost +$5B. Nordics and renewable power are immune; France's nuclear grid takes only +$3B.",
    effects: [
      { kind: "surcharge-tag", tags: ["nuclear"], amount: 3, exemptRegionIds: ["france"] },
      { kind: "surcharge-tag", tags: ["domestic-build"], amount: 5, exemptTags: ["renewable"], exemptRegionIds: ["nordics"] },
    ],
    terms: ["compute"],
  },
  {
    id: "ev-open-breakthrough",
    name: "Open-Weight Breakthrough",
    flavor: "Someone posted the weights at midnight. By morning, a thousand labs had a head start they hadn't paid for.",
    effectText: "Fine-tune & continued pre-training cost −$3B. A good round to own, not rent.",
    effects: [
      { kind: "discount-tag", tags: ["finetune", "continued"], amount: 3 },
    ],
    terms: ["fine-tune", "continued-pretraining", "open"],
  },
  {
    id: "ev-export-controls",
    name: "Export Controls Tighten",
    flavor: "A new clause, three pages deep: aligned jurisdictions only. The rest get a slower lane — or none.",
    effectText: "Chinese-chip options carry double sanction risk. Direct Nvidia is frozen without a supply deal or ASML.",
    effects: [
      { kind: "double-sanction", tags: ["chinese"] },
      { kind: "freeze-precondition", preconditions: ["supply-allocation"] },
    ],
    terms: ["aligned-jurisdiction", "sanction-risk", "nvidia"],
  },
  {
    id: "ev-capital-flight",
    name: "Capital Flight",
    flavor: "The founders packed for California again. The term sheets followed them out the door.",
    effectText: "Rented / foreign options cost −$3B now — but each one adds +1 exposure to this round's off-switch die.",
    effects: [
      { kind: "discount-tag", tags: ["rented", "foreign"], amount: 3 },
      { kind: "exposure-bonus", tags: ["rented", "foreign"], amount: 1 },
    ],
    terms: ["exposure", "off-switch"],
  },
  {
    id: "ev-talent-war",
    name: "Talent War",
    flavor: "Three of the lab's best got an email from Menlo Park. Two are already gone.",
    effectText: "All model-building costs +$3B — except Canada and India.",
    effects: [
      { kind: "surcharge-tag", tags: ["model-build"], amount: 3, exemptRegionIds: ["canada", "india"] },
    ],
  },
  {
    id: "ev-swf-floods",
    name: "Sovereign Wealth Floods In",
    flavor: "A Gulf fund wired more than the entire national research budget, and asked for very little in writing.",
    effectText: "Take +$30B this round if you accept a standing investment (the backer gets 15% of your final score).",
    effects: [
      { kind: "swf-stipend", amount: 30 },
    ],
    terms: ["standing-investment"],
  },
  {
    id: "ev-cable-cut",
    name: "A Cable Is Cut",
    flavor: "Somewhere under the Baltic, a fiber line went dark. No one claimed it. Everyone understood it.",
    effectText: "Foreign cloud & rented options are unreliable: roll for each — on 1–2 it doesn't deliver.",
    effects: [
      { kind: "unreliable-rented", tags: ["foreign", "rented"] },
    ],
  },
  {
    id: "ev-summit",
    name: "The Coalition Holds a Summit",
    flavor: "For one afternoon, the speeches stopped and the spreadsheets came out. Real terms, real signatures.",
    effectText: "Every deal grants +1 bonus Deal-score; shared-cluster / coalition-weights cost −$5B.",
    effects: [
      { kind: "deal-bonus", amount: 1 },
      { kind: "discount-tag", tags: [], optionIds: ["co-coalition", "w-coalition"], amount: 5 },
    ],
    terms: ["standing-deal"],
  },
  {
    id: "ev-hallucinate",
    name: "A Sovereign Model Hallucinates",
    flavor: "The ministry's own AI invented a trade embargo that wasn't real. The markets believed it for six hours.",
    effectText: "A rushed / under-built model (from-scratch on small compute, or distilled) takes a −2 Adoption trust hit.",
    effects: [
      { kind: "trust-hit-rushed", amount: 2 },
    ],
    terms: ["hallucinate"],
  },
  {
    id: "ev-rehearsal",
    name: "The Off-Switch Rehearsal",
    flavor: "It wasn't the real thing. Just a 'maintenance window' that happened to last four hours and hit one continent.",
    effectText: "The off-switch die rolls twice at the end of this round. Exposed stacks, brace.",
    effects: [
      { kind: "offswitch-twice" },
    ],
    terms: ["off-switch"],
  },
];

export const EVENT_BY_ID = Object.fromEntries(WORLD_EVENTS.map((e) => [e.id, e]));

/** All world-event card ids — the deck a game draws from. */
export const WORLD_EVENT_IDS = WORLD_EVENTS.map((e) => e.id);

/** A pleasant escalating order, used only as a fallback if a deck isn't drawn. */
export const SEEDED_EVENT_ORDER = [
  "ev-nvidia-toll",
  "ev-cost-gap",
  "ev-open-breakthrough",
  "ev-export-controls",
  "ev-summit",
];

// ─── 12b. Off-switch outcomes (6) ──────────────────────────────────────────
export const OFFSWITCH_OUTCOMES: OffSwitchOutcome[] = [
  {
    id: "os-api-revoked",
    name: "API Access Revoked",
    flavor: "The login stopped working. No warning, no appeal, just a billing page that said 'unavailable in your region.'",
    hits: ["closed-api"],
    damage: 0,
  },
  {
    id: "os-cloud-eviction",
    name: "Cloud Eviction",
    flavor: "The cloud provider 'regretfully' suspended the account, citing a compliance review with no end date.",
    hits: ["foreign-cloud", "foreign-hosting"],
    damage: 0,
  },
  {
    id: "os-chip-embargo",
    name: "Chip Embargo",
    flavor: "The next shipment simply never left port. The one after that was 'under review.'",
    hits: ["chinese-chips", "nvidia-no-deal", "gray-market"],
    damage: 0,
  },
  {
    id: "os-weights-withheld",
    name: "Weights Withheld",
    flavor: "The update they'd been promised never shipped. The model they rented began to feel a year behind.",
    hits: ["rented-weights"],
    damage: 0,
  },
  {
    id: "os-quiet-squeeze",
    name: "The Quiet Squeeze",
    flavor: "Nothing dramatic. Just slower approvals, higher prices, a polite reminder of who held the cards.",
    hits: ["closed-api", "foreign-cloud", "foreign-hosting", "rented-weights", "chinese-chips", "nvidia-no-deal", "gray-market"],
    broad: true,
    damage: 0.5, // smaller shave
  },
  {
    id: "os-false-alarm",
    name: "A False Alarm",
    flavor: "The threat came, the panic spread — and then nothing happened. This time.",
    hits: [],
    falseAlarm: true,
    damage: 0,
  },
];

export const OUTCOME_BY_ID = Object.fromEntries(OFFSWITCH_OUTCOMES.map((o) => [o.id, o]));
