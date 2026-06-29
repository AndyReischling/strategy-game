import type { Region } from "./types";

// All discount/penalty numbers are starting values to tune in playtest (§4a).
export const REGIONS: Region[] = [
  {
    id: "france",
    name: "France",
    flag: "🇫🇷",
    color: "blue",
    anchor: { x: 47.5, y: 35 },
    strengths: { chips: 0, compute: 2, talent: -1, weights: 2, market: 1, capital: 1 },
    powers: [
      "Nuclear grid — domestic-compute builds cost −40%",
      "State-bank backing (Bpifrance) — one standing loan without a partner",
    ],
    assets: [
      { id: "mistral-license", name: "Mistral", blurb: "National-champion model + sovereign cloud. License it to others for Credits.", tradeable: true },
    ],
    weakness: "Thin deep-talent pool — frontier pre-training is expensive.",
    signatureMove: "Full-stack sovereign play: cheap clean compute + own model + own hosting.",
    hook: "Macron's €109B push; Le Chat over ChatGPT; Bpifrance in every Mistral round; Bruyères-le-Châtel on the nuclear grid.",
    shortOn: "Talent",
    creditBonus: 0,
    services: ["Lease cheap nuclear compute rights (power-as-a-service)", "License Mistral stack path"],
    priceRules: [
      { appliesTo: { tags: ["nuclear", "domestic-build"] }, pctOff: 0.4, note: "Nuclear grid −40%" },
      { appliesTo: { optionIds: ["w-mistral"] }, setCost: 0, note: "Mistral base free to France" },
    ],
  },
  {
    id: "canada",
    name: "Canada",
    flag: "🇨🇦",
    color: "orange",
    anchor: { x: 21, y: 26 },
    strengths: { chips: -1, compute: -1, talent: 3, weights: 2, market: 0, capital: 0 },
    powers: [
      "World-class research talent (Mila/Vector/Amii) — model-building −40% on talent",
      "High political standing — trusted broker",
    ],
    assets: [
      { id: "cohere-license", name: "Cohere", blurb: "Enterprise model-maker (discounted L3–L4 path) + Aleph Alpha EU tie.", tradeable: true },
    ],
    weakness: "Little domestic power or compute — must buy or deal for L1/L2.",
    signatureMove: "Be the model foundry: build the best/cheapest weights, then sell or license them.",
    hook: "Turing-award lineage; Cohere's enterprise focus; Mila/Vector as global talent magnets.",
    shortOn: "Power, compute",
    creditBonus: 0,
    services: ["Sell/license trained weights", "Broker deals (high standing)"],
    priceRules: [
      { appliesTo: { tags: ["model-build"] }, pctOff: 0.4, note: "Research talent −40%" },
    ],
  },
  {
    id: "netherlands",
    name: "Netherlands",
    flag: "🇳🇱",
    color: "orange",
    anchor: { x: 49, y: 30 },
    strengths: { chips: 3, compute: -1, talent: 0, weights: 0, market: 0, capital: 0 },
    powers: [
      "The chip chokepoint — gate rivals' Nvidia access",
      "Nvidia allocations at −30%",
    ],
    assets: [
      { id: "asml-token", name: "ASML token", blurb: "One-of-a-kind. Holder inherits the chip discount and the gating power.", tradeable: true },
    ],
    weakness: "Little domestic compute or power — owns the leverage, not the build.",
    signatureMove: "Kingmaker: control who else can build, and charge for it. Sell ASML at a chip-scarcity peak.",
    hook: "ASML is the sole maker of EUV lithography — the most powerful European card in the stack.",
    shortOn: "Compute, power",
    creditBonus: 0,
    services: ["Sell/lease the ASML token", "Gate a rival's Nvidia access"],
    priceRules: [
      { appliesTo: { tags: ["nvidia"] }, pctOff: 0.3, note: "Chip chokepoint −30%" },
    ],
  },
  {
    id: "nordics",
    name: "Nordics",
    flag: "🇸🇪",
    color: "teal",
    anchor: { x: 52, y: 19 },
    strengths: { chips: 0, compute: 3, talent: -1, weights: 0, market: 0, capital: 1 },
    powers: [
      "Renewable power + cold climate — renewable-compute −40%, immune to energy crunch",
      "Sovereign-wealth capital — convert to a standing investment in another player",
    ],
    assets: [
      { id: "renewable-sites", name: "Renewable data-center sites", blurb: "Prime Narvik-style sites, leasable to compute-builders.", tradeable: true },
    ],
    weakness: "Small talent pool.",
    signatureMove: "Green-compute landlord: host everyone's clusters cheaply and clean; bankroll partners for a share.",
    hook: "Nscale's Narvik campus (30,000+ GPUs, renewable-powered); Nordic sovereign wealth; the cooling advantage.",
    shortOn: "Talent",
    creditBonus: 3,
    services: ["Lease renewable data-center sites", "Standing investment for a cut of a partner's score"],
    priceRules: [
      { appliesTo: { tags: ["renewable"] }, pctOff: 0.4, note: "Renewable grid −40%" },
    ],
  },
  {
    id: "japan-korea",
    name: "Japan / Korea",
    flag: "🇯🇵",
    color: "violet",
    anchor: { x: 84, y: 36 },
    strengths: { chips: 2, compute: 1, talent: 0, weights: 0, market: 1, capital: 1 },
    powers: [
      "Domestic hardware supply — supply mid-tier chips without an Nvidia allocation",
      "Sell chip/compute access to others at a profit",
    ],
    assets: [
      { id: "chip-allocation", name: "Chip / compute allocation", blurb: "Tradeable pool — the politically-safe alternative to Nvidia scarcity & Chinese baggage.", tradeable: true },
    ],
    weakness: "Lower political standing (caught between US and China) — pays more in sanction events.",
    signatureMove: "Arms-length supplier: keep everyone's stacks fed with chips nobody gets sanctioned for buying.",
    hook: "SK Hynix/Samsung HBM dominance; Japanese fabrication and materials; the hedge between the giants.",
    shortOn: "Political standing",
    creditBonus: 0,
    services: ["Sell chip / compute allocation", "Supply mid-tier chips (no Nvidia needed)"],
    priceRules: [
      { appliesTo: { optionIds: ["c-japan-korea"] }, pctOff: 0.5, note: "Domestic hardware base −50%" },
    ],
  },
  {
    id: "germany",
    name: "Germany",
    flag: "🇩🇪",
    color: "ink",
    anchor: { x: 50.5, y: 30.5 },
    strengths: { chips: -1, compute: -1, talent: 1, weights: 0, market: 3, capital: 2 },
    powers: [
      "Huge enterprise/industrial market — premium enterprise distribution channel (big Adoption)",
      "Strong Credits position",
    ],
    assets: [
      { id: "industrial-demand", name: "Industrial demand", blurb: "Airbus/BMW/SAP-style accounts — grant to a partner so their model reaches German industry.", tradeable: true },
      { id: "enterprise-channel", name: "Enterprise channel", blurb: "Premium L5 distribution; auction it to the best bidder.", tradeable: true },
    ],
    weakness: "Weak power, no chips — can't build the bottom of the stack alone.",
    signatureMove: "Demand kingmaker: you own the customers everyone wants. Auction your channel.",
    hook: "Mistral's Airbus/BMW/SAP roster; Germany as Europe's industrial buyer; Nvidia's German industrial-AI cloud.",
    shortOn: "Power, chips",
    creditBonus: 2,
    services: ["Grant the enterprise channel (unlocks L5 enterprise)", "Auction industrial demand"],
    priceRules: [
      { appliesTo: { optionIds: ["h-enterprise"] }, setCost: 0, note: "Owns the enterprise channel" },
    ],
  },
  {
    id: "uk",
    name: "UK",
    flag: "🇬🇧",
    color: "blue",
    anchor: { x: 45.5, y: 28 },
    strengths: { chips: 0, compute: 1, talent: 1, weights: 0, market: 1, capital: 3 },
    powers: [
      "Deep capital markets (City of London) — raise one extra mid-game Credit injection",
      "Strong research base — small discount on model-building",
    ],
    assets: [
      { id: "nscale-capacity", name: "Nscale", blurb: "Sovereign-compute champion; leasable GPU capacity in UK/Norway/Iceland.", tradeable: true },
    ],
    weakness: "Limited domestic power.",
    signatureMove: "Financier-builder: raise capital others can't, build/lease compute, play money and metal.",
    hook: "Nscale's $2B raise and 300k-GPU UK ambition; London as Europe's deepest capital market; UK–France rivalry.",
    shortOn: "Power",
    creditBonus: 0,
    services: ["Raise a one-time debt injection", "Lease Nscale GPU capacity"],
    priceRules: [
      { appliesTo: { tags: ["model-build"] }, pctOff: 0.15, note: "Research base −15%" },
      { appliesTo: { optionIds: ["co-renewable"] }, pctOff: 0.3, note: "Nscale sovereign compute −30%" },
    ],
  },
  {
    id: "gulf-swf",
    name: "Gulf SWF",
    flag: "🏦",
    color: "yellow",
    anchor: { x: 60, y: 45 },
    strengths: { chips: -1, compute: -1, talent: -1, weights: -1, market: -1, capital: 3 },
    powers: [
      "Bottomless capital — large starting bonus; can buy more spending power",
      "No power, no talent, no chips, no market — builds nothing alone",
    ],
    assets: [
      { id: "swf-financing", name: "Sovereign-wealth financing", blurb: "Bankroll any player's stack for an equity-style cut of their final score.", tradeable: true },
    ],
    weakness: "Total dependence on others to build anything real.",
    signatureMove: "Venture financier: spread money across the most promising stacks, collect a share of the winner.",
    hook: "Gulf SWFs (MGX/Mubadala-style) as anchor investors in global AI compute; money seeking sovereign-AI returns.",
    shortOn: "Talent, power — builds nothing alone",
    creditBonus: 14,
    services: ["Standing investment for a cut of a partner's score", "Single-handedly fund a coalition cluster"],
    priceRules: [],
  },
  {
    id: "india",
    name: "India",
    flag: "🇮🇳",
    color: "orange",
    anchor: { x: 70, y: 47 },
    strengths: { chips: -1, compute: 0, talent: 2, weights: 0, market: 3, capital: -1 },
    powers: [
      "Vast consumer market + engineering volume — huge consumer distribution channel",
      "−30% on the talent portion of model-building",
    ],
    assets: [
      { id: "consumer-channel", name: "Consumer market channel", blurb: "Grant to a partner for mass-adoption reach — scale over margin.", tradeable: true },
    ],
    weakness: "Thin domestic capital and no chips.",
    signatureMove: "Adoption giant: route a good-enough open model to a billion users; win on distribution.",
    hook: "India's developer/engineering scale; massive price-sensitive consumer base; open-model affinity.",
    shortOn: "Capital, chips",
    creditBonus: 0,
    services: ["Grant the consumer channel (unlocks mass L5 reach)"],
    priceRules: [
      { appliesTo: { tags: ["model-build"] }, pctOff: 0.3, note: "Engineering volume −30%" },
      { appliesTo: { optionIds: ["h-consumer-app"] }, pctOff: 0.5, note: "Owns the consumer channel" },
    ],
  },
  {
    id: "oss-commons",
    name: "OSS Commons",
    flag: "🌐",
    color: "green",
    advanced: true,
    anchor: { x: 30, y: 62 },
    strengths: { chips: -1, compute: -1, talent: 0, weights: 3, market: 1, capital: -1 },
    powers: [
      "Openness as leverage — starts holding free open weights it can grant",
      "High political standing; immune to off-switch damage at L4",
    ],
    assets: [
      { id: "open-weights-grant", name: "Free open weights to grant", blurb: "The only region that can hand another player a free Layer 4.", tradeable: true },
    ],
    weakness: "No money advantage, no power, no compute, no chips — by far the hardest seat.",
    signatureMove: "The catalyst: seed the table with open weights, take bonuses for enabling adoption.",
    hook: "The open-weight movement (Llama/Mistral/DeepSeek lineage); 'the model is already free' as a strategic fact.",
    shortOn: "Almost everything else",
    creditBonus: 0,
    services: ["Grant free open weights (a free L4 for a partner)", "Lend political standing / cover"],
    priceRules: [
      { appliesTo: { tags: ["open"] }, pctOff: 0.25, note: "Openness as leverage −25%" },
    ],
  },
];

export const REGION_BY_ID: Record<string, Region> = Object.fromEntries(
  REGIONS.map((r) => [r.id, r]),
);

/** Non-playable benchmark + alternative supply markers shown on the board. */
export const BENCHMARK_MARKERS = [
  { id: "usa", name: "United States", flag: "🇺🇸", anchor: { x: 18, y: 38 }, label: "The incumbent — hyperscalers, frontier labs, a Hyperion-class megacluster.", dominant: true },
  { id: "china", name: "China", flag: "🇨🇳", anchor: { x: 78, y: 41 }, label: "Huawei / DeepSeek — the alternative supply, with political baggage.", dominant: false },
  { id: "eurohpc", name: "EuroHPC", flag: "🇪🇺", anchor: { x: 53, y: 33 }, label: "Europe's shared public supercomputers — cheap, sovereign, small.", dominant: false },
];
