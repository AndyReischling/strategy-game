// ─────────────────────────────────────────────────────────────────────────
// SOVEREIGN STACK — core data types
// All tunable numbers live in the data files; the engine only reads them.
// ─────────────────────────────────────────────────────────────────────────

export type LayerId = "chips" | "compute" | "model" | "weights" | "hosting";

export type SpotColor = "blue" | "yellow" | "orange" | "green" | "ink" | "violet" | "teal";

/** Precondition that an option needs before it can be built. Most are met via a deal. */
export type Precondition =
  | "none"
  | "supply-allocation" // Nvidia direct: needs a supply deal OR the ASML token
  | "deal-compute" // needs a compute-holder to grant cluster access
  | "high-power" // needs a strong domestic power base (own a power Power, or deal)
  | "renewable-power" // needs a cold/renewable base
  | "open-weights" // needs an open L4 weight chosen/granted
  | "closed-partner" // needs an ongoing closed-API deal
  | "asml-token" // must hold the ASML token
  | "co-funders-2" // needs ≥2 co-funders (coalition)
  | "co-funder-1" // needs ≥1 partner committed
  | "market-channel" // needs a market-channel grant (Germany / India / a market region)
  | "political-standing" // needs sufficient political standing
  | "oss-grant"; // OSS Commons player present & willing

/** What kind of off-switch exposure a pick carries (drives die damage). */
export type ExposureKind =
  | "none"
  | "closed-api" // rented closed model
  | "foreign-cloud" // foreign hyperscaler compute
  | "foreign-hosting" // foreign cloud hosting
  | "chinese-chips" // Chinese chips (during sanction events)
  | "rented-weights" // rented/closed weights
  | "nvidia-no-deal" // Nvidia without a secured supply deal
  | "gray-market"; // unreliable supply, rolls each round

/** Tags drive coherence synergy/penalty and event targeting. */
export type OptionTag =
  | "open"
  | "closed"
  | "rented"
  | "foreign"
  | "sovereign"
  | "owned"
  | "domestic-build"
  | "renewable"
  | "nuclear"
  | "nvidia"
  | "chinese"
  | "small-compute" // HPC / edge — caps model size
  | "pretrain-scratch"
  | "pretrain-small"
  | "continued"
  | "finetune"
  | "localize"
  | "distill"
  | "open-ecosystem"
  | "consumer-app"
  | "enterprise"
  | "consumer-market"
  | "public-sector"
  | "on-device"
  | "model-build" // any L3 build (talent-sensitive)
  | "leverage"; // ASML-style: control, not build

export interface LayerOption {
  id: string;
  layer: LayerId;
  name: string;
  /** Real-world actor shown in the UI, e.g. "Nvidia GB300". */
  actor?: string;
  /** Plain-language italic explainer shown under every option (the teaching layer). */
  explainer: string;
  baseCost: number;
  requires: Precondition;
  catch: string;
  /** Raw adoption value contributed by this pick. */
  adoption: number;
  /** Sovereignty contribution: + sovereign/owned, − rented/closed/foreign. Range ~ -2..+3. */
  sovereignty: number;
  exposure: ExposureKind;
  sanctionRisk?: boolean;
  /** Per-round recurring credit cost. */
  recurring?: number;
  tags: OptionTag[];
  /** Glossary term ids relevant to this option (for inline Term wrapping). */
  terms?: string[];
}

export interface Layer {
  id: LayerId;
  index: number; // 1..5
  name: string;
  icon: string;
  /** plain question the player is answering at this step */
  question: string;
  blurb: string;
  options: LayerOption[];
}

/** A region's price rule — how its Powers change prices for it. */
export interface PriceRule {
  appliesTo: { optionIds?: string[]; tags?: OptionTag[]; layers?: LayerId[] };
  pctOff?: number; // 0.4 => −40%
  flatOff?: number; // credits off
  setCost?: number; // hard override (e.g. 0 = free)
  /** UI badge, e.g. "Nuclear grid −40%". */
  note: string;
}

export type AssetId =
  | "asml-token"
  | "mistral-license"
  | "cohere-license"
  | "nscale-capacity"
  | "enterprise-channel"
  | "consumer-channel"
  | "open-weights-grant"
  | "renewable-sites"
  | "chip-allocation"
  | "swf-financing"
  | "industrial-demand";

export interface RegionAsset {
  id: AssetId;
  name: string;
  blurb: string;
  /** can be sold/leased to another player */
  tradeable: boolean;
}

/** Dashboard barometer dimensions — a region's structural hand. */
export type StrengthDim = "chips" | "compute" | "talent" | "weights" | "market" | "capital";

/** -1 short · 0 none · 1 ok · 2 strong · 3 dominant */
export type StrengthProfile = Record<StrengthDim, number>;

export interface Region {
  id: string;
  name: string;
  flag: string;
  color: SpotColor;
  advanced?: boolean;
  /** structural strengths/weaknesses shown on the dashboard barometer */
  strengths: StrengthProfile;
  /** map territory anchor in board % coords (0..100, 0..100) */
  anchor: { x: number; y: number };
  powers: string[];
  assets: RegionAsset[];
  weakness: string;
  signatureMove: string;
  hook: string;
  shortOn: string;
  /** starting credit bonus added to the global base budget (Gulf/Nordics > 0). */
  creditBonus: number;
  priceRules: PriceRule[];
  /** special tradeable services this region can sell (power-as-a-service, gating, financing…). */
  services: string[];
}

// ─── World events & off-switch ───────────────────────────────────────────

export type EventEffectKind =
  | "surcharge-tag"
  | "discount-tag"
  | "freeze-precondition"
  | "double-sanction"
  | "exposure-bonus"
  | "deal-bonus"
  | "offswitch-twice"
  | "trust-hit-rushed"
  | "unreliable-rented"
  | "swf-stipend";

export interface WorldEvent {
  id: string;
  name: string;
  flavor: string;
  effectText: string;
  effects: EventEffect[];
  terms?: string[];
}

export interface EventEffect {
  kind: EventEffectKind;
  tags?: OptionTag[];
  optionIds?: string[];
  preconditions?: Precondition[];
  amount?: number; // credits delta or multiplier or count
  /** tags/regions exempt from this effect */
  exemptRegionIds?: string[];
  exemptTags?: OptionTag[];
}

export interface OffSwitchOutcome {
  id: string;
  name: string;
  flavor: string;
  /** which exposure kinds this outcome damages. empty = no damage. */
  hits: ExposureKind[];
  /** broad gentle hit to any rented/foreign element */
  broad?: boolean;
  /** false-alarm: flags but does not damage */
  falseAlarm?: boolean;
  /** adoption damage multiplier applied to hit layers' adoption this round (0..1 kept) */
  damage: number;
}

export interface GlossaryEntry {
  id: string;
  term: string;
  plain: string;
  why: string;
  group: string;
}

// ─── Player / table state ──────────────────────────────────────────────────

export type Phase =
  | "lobby"
  | "market-open"
  | "world-event"
  | "build"
  | "trade"
  | "off-switch"
  | "score"
  | "final";

export type DealKind = "swap" | "asset" | "access" | "standing";

export interface DealTerms {
  creditsFromTo?: number; // credits moving from -> to (negative = other direction)
  assetId?: AssetId; // asset transferred/leased
  lease?: boolean; // true = lease (recurring), false = permanent sale
  leaseRounds?: number;
  grantsPrecondition?: Precondition; // "open a door"
  unlockNote?: string;
  /** standing-investment: the proposer (investor) takes this fraction of the other's final score */
  investorCut?: number;
  /** does this deal fill a real gap (unlock a precondition / supply a missing layer)? */
  fillsGap?: boolean;
}

export interface Deal {
  id: string;
  kind: DealKind;
  fromPlayerId: string;
  toPlayerId: string;
  terms: DealTerms;
  standing: boolean;
  confirmedFrom: boolean;
  confirmedTo: boolean;
  roundCreated: number;
  active: boolean;
  broken?: boolean;
}

export interface StackPicks {
  chips?: string;
  compute?: string;
  model?: string;
  weights?: string;
  hosting?: string;
}

export interface FragilityMark {
  layer: LayerId;
  round: number;
  outcome: string;
}

export interface Player {
  id: string;
  name: string;
  regionId: string;
  color: SpotColor;
  credits: number;
  picks: StackPicks;
  /** what was actually paid per layer, so re-picks refund correctly */
  paid: Partial<Record<LayerId, number>>;
  /** layers locked at the end of a prior round — changing them costs a switching penalty */
  lockedLayers: LayerId[];
  /** the single layer this player built/changed this round (one move per round); null = move unused */
  movedLayer: LayerId | null;
  /** assets currently held (starts from region, changes via trades) */
  assets: AssetId[];
  /** preconditions unlocked via deals (recomputed each round from active deals) */
  unlocks: Precondition[];
  fragility: FragilityMark[];
  /** standing investments taken: investorId -> score cut fraction */
  backers: { investorId: string; cut: number }[];
  isHuman: boolean;
  /** false once the player has joined and picked a region (ready to play) */
  ready: boolean;
  score: ScoreBreakdown;
}

export interface ScoreBreakdown {
  rawAdoption: number;
  coherence: number; // multiplier
  sovereignty: number; // multiplier
  deals: number; // flat points
  fragilityPenalty: number;
  final: number;
  /** human-readable reasons for the panel */
  notes: string[];
}

export interface OffSwitchPlayerResult {
  playerId: string;
  spared: boolean;
  falseAlarm: boolean;
  damagedLayers: LayerId[];
  adoptionLost: number;
}

export type LogKind = "round" | "event" | "build" | "deal" | "offswitch" | "score" | "game";

export interface LogEntry {
  id: number;
  round: number;
  kind: LogKind;
  text: string;
  ts: number;
}

export interface TableState {
  code: string;
  round: number;
  phase: Phase;
  hostId?: string;
  log: LogEntry[];
  /** the shuffled world-event cards drawn for this game (one per round) */
  eventDeck?: string[];
  /** seed used to draw the event deck — shared across tables in one event so
   *  every table sees the same card each round (random per event, fair across tables) */
  eventSeed?: number;
  eventId?: string;
  players: Player[];
  deals: Deal[];
  /** off-switch results this round, for board reactions */
  lastRoll?: {
    rolls: number[];
    triggered: boolean;
    outcomeId?: string;
    results: OffSwitchPlayerResult[];
  };
  /** standing deals broken this round (for board + notices) */
  brokenDeals?: string[];
  seed: number;
  updatedAt: number;
}

export interface LeaderboardRow {
  playerId: string;
  table: string;
  name: string;
  regionId: string;
  regionName: string;
  flag: string;
  color: SpotColor;
  score: number;
}
