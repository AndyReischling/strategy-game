import type {
  TableState,
  Player,
  Deal,
  LayerId,
  LogKind,
  ScoreBreakdown,
  SpotColor,
  OffSwitchPlayerResult,
} from "../data/types";
import type { GameAction } from "./actions";
import { CONFIG, SEAT_COLORS } from "../data/config";
import { REGIONS, REGION_BY_ID } from "../data/regions";
import { OPTION_BY_ID } from "../data/layers";
import {
  EVENT_BY_ID,
  WORLD_EVENT_IDS,
  OFFSWITCH_OUTCOMES,
} from "../data/events";
import { priceFor } from "./pricing";
import { computeScore, computeCoherence, computeSovereignty } from "./scoring";
import { canBuild } from "./preconditions";
import { resolveOffSwitch } from "./offswitch";
import { mulberry32, rollDie, hashStringToSeed } from "./rng";

const BOT_NAMES = ["Atlas", "Borealis", "Cygnus", "Delta", "Echo", "Fjord"];

export function emptyScore(): ScoreBreakdown {
  return {
    rawAdoption: 0,
    coherence: 1,
    sovereignty: 1,
    deals: 0,
    fragilityPenalty: 0,
    final: 0,
    notes: [],
  };
}

export function newTable(code: string, seed?: number, eventSeed?: number): TableState {
  // Each game gets its own random per-table seed (unless one is passed for
  // tests) — drives the off-switch dice, which are per-table. The event deck
  // uses a separate eventSeed that the server shares across every table, so
  // all tables see the same world-event card each round (random per event,
  // but synchronized for a fair leaderboard).
  const gameSeed =
    seed ?? ((hashStringToSeed(code.toUpperCase()) ^ Math.floor(Math.random() * 0xffffffff)) >>> 0);
  return {
    code: code.toUpperCase(),
    round: 0,
    phase: "lobby",
    log: [],
    players: [],
    deals: [],
    seed: gameSeed,
    eventSeed,
    updatedAt: Date.now(),
  };
}

/** Draw the round-by-round world events: a seeded shuffle of distinct cards. */
function drawEventDeck(seed: number, rounds: number): string[] {
  const rng = mulberry32(seed ^ hashStringToSeed("events"));
  const ids = [...WORLD_EVENT_IDS];
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  // if more rounds than cards, wrap around (re-shuffles past the deck length)
  const deck: string[] = [];
  for (let r = 0; r < rounds; r++) deck.push(ids[r % ids.length]);
  return deck;
}

function pushLog(table: TableState, kind: LogKind, text: string) {
  table.log.push({ id: table.log.length, round: table.round, kind, text, ts: Date.now() });
  if (table.log.length > 120) table.log.splice(0, table.log.length - 120);
}

export function newPlayer(id: string, name: string, isHuman: boolean): Player {
  return {
    id,
    name,
    regionId: "",
    color: "blue",
    credits: CONFIG.startingBudget,
    picks: {},
    paid: {},
    lockedLayers: [],
    movedLayer: null,
    actionThisRound: null,
    assets: [],
    unlocks: [],
    fragility: [],
    raisesUsed: 0,
    backers: [],
    isHuman,
    ready: false,
    score: emptyScore(),
  };
}

// ─── VC pitch: capital follows a credible, defensible plan ───────────────────
const MIN_PITCH_LEN = 12;
const MAX_RAISES = 2;

function pickedFor(player: Player) {
  return (Object.values(player.picks).filter(Boolean) as string[])
    .map((id) => OPTION_BY_ID[id])
    .filter(Boolean);
}

/** Non-negotiable reasons the VC walks regardless of how good the pitch is. */
function pitchHardFloor(player: Player): string | null {
  if (player.regionId === "gulf-swf") {
    return player.raisesUsed >= MAX_RAISES + 1
      ? "Even sovereign wealth wants to see it deployed — back a partner first."
      : null;
  }
  if (pickedFor(player).length < 2)
    return "You've barely begun. Build more of your stack before asking for money.";
  if (player.raisesUsed >= MAX_RAISES)
    return "You've raised twice already — investors want to see returns before the next round.";
  return null;
}

export function evaluatePitch(player: Player): { funded: boolean; amount: number; reason: string } {
  const floor = pitchHardFloor(player);
  if (floor) return { funded: false, amount: 0, reason: floor };

  if (player.regionId === "gulf-swf")
    return { funded: true, amount: 30, reason: "Sovereign-wealth backing — the capital is already yours to direct." };

  const picks = pickedFor(player);
  const sov = computeSovereignty(picks);
  const coh = computeCoherence(picks).multiplier;

  if (sov.fraction <= -0.2) return { funded: false, amount: 0, reason: "Too exposed — they fear an off-switch wipes their investment overnight." };
  if (coh < 1.0) return { funded: false, amount: 0, reason: "Your picks don't hang together. Investors want a coherent plan, not a grab-bag." };

  const amount = sov.fraction >= 0.4 ? 25 : 15;
  return { funded: true, amount, reason: "A coherent, defensible plan — the term sheet is yours." };
}

function findPlayer(table: TableState, id: string): Player | undefined {
  return table.players.find((p) => p.id === id);
}

function assignColor(table: TableState): SpotColor {
  const used = new Set(table.players.map((p) => p.color));
  for (const c of SEAT_COLORS) if (!used.has(c)) return c as SpotColor;
  return SEAT_COLORS[table.players.length % SEAT_COLORS.length] as SpotColor;
}

function activeDeals(table: TableState): Deal[] {
  return table.deals.filter((d) => d.active && !d.broken);
}

// ─── Unlocks recomputed from active deals + region inherent (inherent merged in canBuild) ──
function recomputeUnlocks(table: TableState) {
  for (const p of table.players) {
    const unlocks = new Set<Player["unlocks"][number]>();
    for (const d of activeDeals(table)) {
      const gp = d.terms.grantsPrecondition;
      if (!gp) continue;
      // Both sides of an access/co-fund deal hold the unlock. The partner who
      // grants it already had it; the player who set the deal up to clear their
      // OWN blocked build needs it on their side too — otherwise they pay and
      // stay locked.
      if (d.toPlayerId === p.id || d.fromPlayerId === p.id) unlocks.add(gp);
    }
    p.unlocks = Array.from(unlocks);
  }
}

// ─── Deal execution ────────────────────────────────────────────────────────
function moveAsset(table: TableState, deal: Deal) {
  const assetId = deal.terms.assetId;
  if (!assetId || deal.terms.lease) return; // lease keeps ownership
  const from = findPlayer(table, deal.fromPlayerId);
  const to = findPlayer(table, deal.toPlayerId);
  if (!from || !to) return;
  // move from whichever side currently holds it to the other
  if (from.assets.includes(assetId)) {
    from.assets = from.assets.filter((a) => a !== assetId);
    if (!to.assets.includes(assetId)) to.assets.push(assetId);
  } else if (to.assets.includes(assetId)) {
    to.assets = to.assets.filter((a) => a !== assetId);
    if (!from.assets.includes(assetId)) from.assets.push(assetId);
  }
}

function moveCredits(table: TableState, deal: Deal) {
  const c = deal.terms.creditsFromTo ?? 0;
  if (!c) return;
  const from = findPlayer(table, deal.fromPlayerId);
  const to = findPlayer(table, deal.toPlayerId);
  if (!from || !to) return;
  from.credits = Math.max(0, from.credits - c);
  to.credits += c;
}

function executeDealOnce(table: TableState, deal: Deal) {
  moveCredits(table, deal);
  moveAsset(table, deal);
  if (deal.terms.investorCut) {
    const to = findPlayer(table, deal.toPlayerId);
    if (to && !to.backers.some((b) => b.investorId === deal.fromPlayerId)) {
      to.backers.push({ investorId: deal.fromPlayerId, cut: deal.terms.investorCut });
    }
  }
}

// ─── Deal negotiation (offer → counter → accept, with instant bot replies) ───
const MAX_COUNTERS = 4;

/** The side that still has to answer the latest terms (null once settled). */
function dealResponderId(d: Deal): string | null {
  if (d.active || d.broken || d.declined) return null;
  if (!d.confirmedTo) return d.toPlayerId;
  if (!d.confirmedFrom) return d.fromPlayerId;
  return null;
}

function activateIfAgreed(table: TableState, d: Deal) {
  if (d.confirmedFrom && d.confirmedTo && !d.active && !d.declined) {
    d.active = true;
    executeDealOnce(table, d);
    recomputeUnlocks(table);
    const f = findPlayer(table, d.fromPlayerId);
    const t = findPlayer(table, d.toPlayerId);
    pushLog(table, "deal", `${f?.name} ${d.standing ? "+ standing deal +" : "↔"} ${t?.name} — agreed.`);
  }
}

/** How a bot weighs a deal it must answer: + good for the bot, − costs it. */
function botDealValue(table: TableState, d: Deal, bot: Player): { value: number; netCash: number } {
  const isTo = d.toPlayerId === bot.id;
  const c = d.terms.creditsFromTo ?? 0; // >0 = `from` pays `to`
  const netCash = isTo ? c : -c; // cash the bot nets from the deal
  let nonCash = 0;
  if (d.terms.grantsPrecondition) nonCash += isTo ? 8 : -8; // unlock lands on `to`
  if (d.terms.assetId) {
    const fromHolds = (findPlayer(table, d.fromPlayerId)?.assets ?? []).includes(d.terms.assetId);
    const botHolds = (fromHolds && d.fromPlayerId === bot.id) || (!fromHolds && d.toPlayerId === bot.id);
    const worth = d.terms.lease ? 3 : 6;
    nonCash += botHolds ? -worth : worth;
  }
  if (d.terms.investorCut) nonCash += isTo ? 4 : -2;
  return { value: netCash + nonCash, netCash };
}

function botDecideDeal(table: TableState, d: Deal, bot: Player):
  | { action: "accept" }
  | { action: "counter"; terms: typeof d.terms }
  | { action: "decline" } {
  const isTo = d.toPlayerId === bot.id;
  const c = d.terms.creditsFromTo ?? 0;
  const { value, netCash } = botDealValue(table, d, bot);
  const canAfford = netCash >= 0 || bot.credits >= -netCash;

  if (value >= 0 && canAfford) return { action: "accept" };

  if ((d.counters ?? 0) < MAX_COUNTERS) {
    const extra = Math.ceil(-value) + 2; // cash the bot needs to come out ahead
    if (extra <= 30) {
      const newC = isTo ? c + extra : c - extra; // pull cash toward the bot
      return { action: "counter", terms: { ...d.terms, creditsFromTo: newC } };
    }
  }
  return { action: "decline" };
}

/** Settle every deal currently waiting on a bot — instantly, in a loop. */
function resolveBotDeals(table: TableState) {
  for (let guard = 0; guard < 24; guard++) {
    const deal = table.deals.find((d) => {
      if (d.roundCreated !== table.round) return false;
      const r = dealResponderId(d);
      if (!r) return false;
      return !findPlayer(table, r)?.isHuman;
    });
    if (!deal) break;
    const bot = findPlayer(table, dealResponderId(deal)!)!;
    const decision = botDecideDeal(table, deal, bot);
    const other = findPlayer(table, bot.id === deal.toPlayerId ? deal.fromPlayerId : deal.toPlayerId);
    if (decision.action === "accept") {
      if (bot.id === deal.toPlayerId) deal.confirmedTo = true; else deal.confirmedFrom = true;
      deal.lastActorId = bot.id;
      activateIfAgreed(table, deal);
    } else if (decision.action === "counter") {
      deal.terms = decision.terms;
      deal.counters = (deal.counters ?? 0) + 1;
      if (bot.id === deal.toPlayerId) { deal.confirmedTo = true; deal.confirmedFrom = false; }
      else { deal.confirmedFrom = true; deal.confirmedTo = false; }
      deal.lastActorId = bot.id;
      pushLog(table, "deal", `${bot.name} countered ${other?.name}'s offer.`);
    } else {
      deal.declined = true;
      const proposer = findPlayer(table, deal.fromPlayerId);
      if (proposer && deal.roundCreated === table.round && proposer.actionThisRound === "deal") proposer.actionThisRound = null;
      pushLog(table, "deal", `${bot.name} declined ${other?.name}'s offer.`);
    }
  }
}

// ─── Region setup: give a player its starting assets ─────────────────────────
function grantStartingAssets(player: Player) {
  const region = REGION_BY_ID[player.regionId];
  if (!region) return;
  player.assets = region.assets.filter((a) => a.tradeable).map((a) => a.id);
  player.credits = CONFIG.startingBudget + region.creditBonus;
}

// ─── Round economy: recurring costs + standing deals + stipend ───────────────
function applyRoundStart(table: TableState) {
  // standing/lease recurring credit transfers
  for (const d of activeDeals(table)) {
    if (d.standing || d.terms.lease) moveCredits(table, d);
  }
  // recurring option costs (rented weights, etc.)
  for (const p of table.players) {
    for (const optionId of Object.values(p.picks)) {
      if (!optionId) continue;
      const opt = OPTION_BY_ID[optionId];
      if (opt?.recurring) p.credits = Math.max(0, p.credits - opt.recurring);
    }
    if (CONFIG.perRoundStipend) p.credits += CONFIG.perRoundStipend;
  }
}

// ─── Bots: simple sovereign-leaning heuristic build ──────────────────────────
const BOT_PLAN: Record<LayerId, string[]> = {
  chips: ["c-sovereign-chips", "c-japan-korea", "c-chinese"],
  compute: ["co-renewable", "co-sovereign-cloud", "co-eurohpc", "co-foreign-hyperscaler"],
  model: ["m-finetune", "m-localize", "m-distill", "m-pretrain-small"],
  weights: ["w-mistral", "w-llama", "w-nemotron"],
  hosting: ["h-national-app", "h-on-device", "h-foreign-cloud"],
};

function botBuild(table: TableState, bot: Player) {
  const event = table.eventId ? EVENT_BY_ID[table.eventId] : undefined;
  const region = REGION_BY_ID[bot.regionId];
  if (!region) return;
  if (bot.actionThisRound) return; // bots also take just one action per round
  for (const layer of Object.keys(BOT_PLAN) as LayerId[]) {
    if (bot.picks[layer]) continue;
    for (const optId of BOT_PLAN[layer]) {
      const opt = OPTION_BY_ID[optId];
      if (!opt) continue;
      const check = canBuild(bot, opt);
      if (!check.ok) continue;
      const price = priceFor(opt, region, event);
      if (price.frozen) continue;
      if (bot.credits >= price.cost) {
        bot.credits -= price.cost;
        bot.picks[layer] = optId;
        bot.paid[layer] = price.cost;
        bot.movedLayer = layer;
        bot.actionThisRound = "build";
        return; // one build, then done for the round
      }
    }
  }
}

// ─── Off-switch roll ─────────────────────────────────────────────────────────
function rollOffSwitch(table: TableState) {
  table.brokenDeals = undefined;
  const event = table.eventId ? EVENT_BY_ID[table.eventId] : undefined;
  const rng = mulberry32(table.seed ^ hashStringToSeed(`r${table.round}-os`));
  const twice = event?.effects.some((e) => e.kind === "offswitch-twice") ?? false;
  const numRolls = twice ? 2 : 1;

  const rolls: number[] = [];
  let triggered = false;
  for (let i = 0; i < numRolls; i++) {
    const v = rollDie(rng);
    rolls.push(v);
    if (v >= CONFIG.offSwitch.triggerMin) triggered = true;
  }

  const results: OffSwitchPlayerResult[] = [];
  let outcomeId: string | undefined;

  if (triggered) {
    const outcome = OFFSWITCH_OUTCOMES[Math.floor(rng() * OFFSWITCH_OUTCOMES.length)];
    outcomeId = outcome.id;
    const hitNames: string[] = [];
    for (const p of table.players) {
      if (!p.ready) continue;
      const res = resolveOffSwitch(p, outcome, table.round, event);
      p.fragility.push(...res.newMarks);
      if (!res.spared) hitNames.push(p.name);
      results.push({
        playerId: p.id,
        spared: res.spared,
        falseAlarm: !!outcome.falseAlarm,
        damagedLayers: res.damaged.map((d) => d.layer),
        adoptionLost: res.adoptionLost,
      });
    }
    pushLog(
      table,
      "offswitch",
      outcome.falseAlarm
        ? `Off-switch: ${outcome.name} — a false alarm, no damage.`
        : hitNames.length
          ? `Off-switch: ${outcome.name}. Hit ${hitNames.join(", ")}.`
          : `Off-switch: ${outcome.name}. Everyone shrugged it off.`,
    );

    // Standing deals can snap under pressure (§4b): both sides pay a penalty.
    if (!outcome.falseAlarm) {
      const broken: string[] = [];
      for (const d of table.deals) {
        if (!d.active || d.broken || !d.standing) continue;
        if (rng() < 0.18) {
          d.broken = true;
          d.active = false;
          broken.push(d.id);
          for (const id of [d.fromPlayerId, d.toPlayerId]) {
            const pl = findPlayer(table, id);
            if (pl) pl.credits = Math.max(0, pl.credits - CONFIG.deals.breakPenalty);
          }
        }
      }
      table.brokenDeals = broken;
    }
  } else {
    for (const p of table.players) {
      if (!p.ready) continue;
      results.push({ playerId: p.id, spared: true, falseAlarm: false, damagedLayers: [], adoptionLost: 0 });
    }
    pushLog(table, "offswitch", `Off-switch die rolled ${rolls.join(" & ")} — the lever didn't fall.`);
  }

  table.lastRoll = { round: table.round, rolls, triggered, outcomeId, results };
}

// ─── Score tick ──────────────────────────────────────────────────────────────
function scoreTick(table: TableState) {
  const event = table.eventId ? EVENT_BY_ID[table.eventId] : undefined;
  const dealBonus = event?.effects.find((e) => e.kind === "deal-bonus")?.amount ?? 0;
  const deals = activeDeals(table);
  for (const p of table.players) {
    if (!p.ready) continue;
    p.score = computeScore(p, deals, { dealBonusPerDeal: dealBonus });
  }
  // backers take their cut of the backed player's final score
  for (const p of table.players) {
    for (const b of p.backers) {
      const investor = findPlayer(table, b.investorId);
      if (investor) {
        investor.score.final = Math.round((investor.score.final + p.score.final * b.cut) * 10) / 10;
        investor.score.notes.push(`+${Math.round(p.score.final * b.cut)} from backing ${p.name}.`);
      }
    }
  }
}

// ─── Phase entry ─────────────────────────────────────────────────────────────
function enterPhase(table: TableState, phase: TableState["phase"]) {
  table.phase = phase;
  switch (phase) {
    case "market-open": {
      if (!table.eventDeck || table.eventDeck.length === 0) {
        table.eventDeck = drawEventDeck(table.eventSeed ?? table.seed, CONFIG.totalRounds);
      }
      table.eventId = table.eventDeck[(table.round - 1) % table.eventDeck.length];
      if (table.round > 1) applyRoundStart(table);
      // fresh single action for everyone this round
      for (const p of table.players) { p.movedLayer = null; p.actionThisRound = null; }
      recomputeUnlocks(table);
      const ev = table.eventId ? EVENT_BY_ID[table.eventId] : undefined;
      pushLog(table, "round", `Round ${table.round} opens.`);
      if (ev) pushLog(table, "event", `${ev.name} — ${ev.effectText}`);
      break;
    }
    case "build": {
      for (const bot of table.players.filter((p) => !p.isHuman && p.ready)) botBuild(table, bot);
      break;
    }
    case "off-switch":
      rollOffSwitch(table);
      break;
    case "score":
      scoreTick(table);
      break;
    default:
      break;
  }
}

// ─── Build / market spend ────────────────────────────────────────────────────
function setPick(table: TableState, player: Player, layer: LayerId, optionId: string): string | null {
  if (table.phase !== "build" && table.phase !== "trade" && table.phase !== "market-open")
    return "You can only build during the build & trade phases.";
  // one action per round — build is allowed only if you haven't acted, or you're
  // refining the same layer you already built this round
  if (player.actionThisRound && !(player.actionThisRound === "build" && player.movedLayer === layer)) {
    return player.actionThisRound === "build"
      ? `One action per round — you've already built ${player.movedLayer} this round.`
      : "One action per round — you've already acted (a deal) this round. Build next round.";
  }
  const option = OPTION_BY_ID[optionId];
  if (!option || option.layer !== layer) return "Unknown option.";
  const region = REGION_BY_ID[player.regionId];
  if (!region) return "Pick a region first.";

  const check = canBuild(player, option);
  if (!check.ok) return `Needs ${check.needs}.`;

  const event = table.eventId ? EVENT_BY_ID[table.eventId] : undefined;
  const price = priceFor(option, region, event);
  if (price.frozen) return "Frozen this round by the world event — strike a deal.";

  const refund = player.paid[layer] ?? 0;
  const penalty = player.lockedLayers.includes(layer) ? CONFIG.switchingCostPenalty : 0;
  const available = player.credits + refund;
  if (available < price.cost + penalty) return "Not enough capital.";

  player.credits = available - price.cost - penalty;
  player.picks[layer] = optionId;
  player.paid[layer] = price.cost;
  player.movedLayer = layer;
  player.actionThisRound = "build"; // this round's single action is spent
  return null;
}

// ─── The reducer ─────────────────────────────────────────────────────────────
export function applyAction(table: TableState, action: GameAction): { error?: string } {
  let error: string | undefined;

  switch (action.type) {
    case "join": {
      if (!findPlayer(table, action.playerId)) {
        if (table.players.length >= CONFIG.maxPlayersPerTable && table.phase === "lobby") {
          error = "Table is full (6 players).";
          break;
        }
        const p = newPlayer(action.playerId, action.name || "Player", true);
        p.color = assignColor(table);
        table.players.push(p);
        if (!table.hostId) table.hostId = action.playerId;
      }
      break;
    }
    case "rename": {
      const p = findPlayer(table, action.playerId);
      if (p) p.name = action.name;
      break;
    }
    case "pickRegion": {
      const p = findPlayer(table, action.playerId);
      if (!p) { error = "Not at this table."; break; }
      if (table.phase !== "lobby") { error = "Regions lock once the game starts."; break; }
      const taken = table.players.some((o) => o.id !== p.id && o.regionId === action.regionId);
      if (taken) { error = "That region is already taken."; break; }
      p.regionId = action.regionId;
      p.ready = true;
      grantStartingAssets(p);
      break;
    }
    case "addBots": {
      if (table.phase !== "lobby") { error = "Can only add bots in the lobby."; break; }
      const free = REGIONS.filter((r) => !table.players.some((p) => p.regionId === r.id));
      const n = Math.min(action.count, CONFIG.maxPlayersPerTable - table.players.length, free.length);
      for (let i = 0; i < n; i++) {
        const bot = newPlayer(`bot-${Date.now()}-${i}`, BOT_NAMES[(table.players.length) % BOT_NAMES.length] + " (bot)", false);
        bot.color = assignColor(table);
        bot.regionId = free[i].id;
        bot.ready = true;
        table.players.push(bot);
        grantStartingAssets(bot);
      }
      break;
    }
    case "startGame": {
      if (table.phase !== "lobby") break;
      const ready = table.players.filter((p) => p.ready);
      if (ready.length === 0) { error = "Pick a region first."; break; }
      pushLog(table, "game", `Game begins — ${ready.length} player${ready.length === 1 ? "" : "s"}.`);
      table.eventDeck = drawEventDeck(table.eventSeed ?? table.seed, CONFIG.totalRounds);
      table.round = 1;
      enterPhase(table, "market-open");
      enterPhase(table, "build"); // single action phase — build/deal/pitch all happen here
      break;
    }
    case "setPick": {
      const p = findPlayer(table, action.playerId);
      if (!p) { error = "Not at this table."; break; }
      const before = Object.keys(p.picks).length;
      error = setPick(table, p, action.layer, action.optionId) ?? undefined;
      if (!error && before < 5 && Object.keys(p.picks).length === 5) {
        pushLog(table, "build", `${p.name}'s five-layer stack is complete.`);
      }
      break;
    }
    case "clearPick": {
      const p = findPlayer(table, action.playerId);
      if (!p) break;
      if (p.actionThisRound && !(p.actionThisRound === "build" && p.movedLayer === action.layer)) {
        error = "One action per round — you can only change the layer you built this round.";
        break;
      }
      const refund = p.paid[action.layer] ?? 0;
      p.credits += refund;
      const wasThisRoundMove = p.movedLayer === action.layer;
      delete p.picks[action.layer];
      delete p.paid[action.layer];
      // undoing this round's build frees the action again; clearing an older pick spends it
      if (wasThisRoundMove) { p.movedLayer = null; p.actionThisRound = null; }
      else { p.movedLayer = action.layer; p.actionThisRound = "build"; }
      break;
    }
    case "pitchVC": {
      const p = findPlayer(table, action.playerId);
      if (!p) break;
      if (table.phase !== "build" && table.phase !== "trade" && table.phase !== "market-open") {
        error = "You can pitch during the build & trade phases.";
        break;
      }
      if (p.actionThisRound) { error = "One action per round — you've already acted this round."; break; }
      const pitch = (action.pitch ?? "").trim();
      if (pitch.length < MIN_PITCH_LEN) { error = "Give General Catalyst a real pitch — two sentences on why to fund your stack."; break; }

      const verdict = evaluatePitch(p);
      p.pitch = { text: pitch, funded: verdict.funded, amount: verdict.amount, reason: verdict.reason, round: table.round };
      // pitching the VC is your action whether they fund you or not — a burned pitch ruins your turn
      p.actionThisRound = "capital";
      if (verdict.funded) {
        p.credits += verdict.amount;
        p.raisesUsed += 1;
        pushLog(table, "deal", `${p.name} raised $${verdict.amount}B from General Catalyst.`);
      } else {
        pushLog(table, "deal", `${p.name} pitched General Catalyst — declined. Turn burned.`);
      }
      break;
    }
    case "resolvePitch": {
      // LLM verdict from /api/pitch, re-validated by the engine so the model can
      // sway the believable middle but never break the hard rules.
      const p = findPlayer(table, action.playerId);
      if (!p) break;
      if (table.phase !== "build" && table.phase !== "trade" && table.phase !== "market-open") {
        error = "You can pitch during the build & trade phases.";
        break;
      }
      if (p.actionThisRound) { error = "One action per round — you've already acted this round."; break; }
      const pitch = (action.pitch ?? "").trim();
      if (pitch.length < MIN_PITCH_LEN) { error = "Give General Catalyst a real pitch — two sentences."; break; }

      const floor = pitchHardFloor(p);
      let funded = action.funded;
      let amount = Math.round(action.amount);
      let reason = action.reason?.trim() || (funded ? "Funded." : "Declined.");
      if (floor) { funded = false; amount = 0; reason = floor; } // hard floors override the model
      amount = funded ? Math.max(10, Math.min(40, amount)) : 0; // clamp into the legal band ($B)

      p.pitch = { text: pitch, funded, amount, reason, round: table.round };
      p.actionThisRound = "capital";
      if (funded) {
        p.credits += amount;
        p.raisesUsed += 1;
        pushLog(table, "deal", `${p.name} raised $${amount}B from General Catalyst.`);
      } else {
        pushLog(table, "deal", `${p.name} pitched General Catalyst — declined. Turn burned.`);
      }
      break;
    }
    case "setEventFlavor": {
      table.eventFlavor = { ...(table.eventFlavor ?? {}), ...action.flavor };
      break;
    }
    case "proposeDeal": {
      const from = findPlayer(table, action.playerId);
      const to = findPlayer(table, action.toPlayerId);
      if (!from || !to) { error = "Player not found."; break; }
      if (table.phase !== "trade" && table.phase !== "market-open" && table.phase !== "build") {
        error = "Deals happen during the build & trade phases.";
        break;
      }
      if (from.actionThisRound) {
        error = from.actionThisRound === "build"
          ? "One action per round — you built this round. Propose deals next round (you can still accept offers)."
          : "One action per round — you've already acted this round.";
        break;
      }
      const deal: Deal = {
        id: `deal-${table.deals.length}-${Math.floor(table.seed % 9999)}-${Date.now() % 100000}`,
        kind: action.kind,
        fromPlayerId: from.id,
        toPlayerId: to.id,
        terms: { ...action.terms, fillsGap: action.terms.fillsGap || !!action.terms.grantsPrecondition },
        standing: action.standing,
        confirmedFrom: true,
        confirmedTo: false,
        roundCreated: table.round,
        active: false,
        counters: 0,
        lastActorId: from.id,
      };
      from.actionThisRound = "deal"; // proposing a deal is your action this round
      table.deals.push(deal);
      // a bot recipient answers instantly via resolveBotDeals() at the end of apply;
      // a human recipient gets a blocking modal and must accept / decline / counter.
      break;
    }
    case "confirmDeal": {
      const p = findPlayer(table, action.playerId);
      const deal = table.deals.find((d) => d.id === action.dealId);
      if (!p || !deal || deal.active || deal.declined || deal.broken) break;
      if (deal.fromPlayerId === p.id) deal.confirmedFrom = true;
      if (deal.toPlayerId === p.id) deal.confirmedTo = true;
      deal.lastActorId = p.id;
      activateIfAgreed(table, deal);
      break;
    }
    case "counterDeal": {
      const p = findPlayer(table, action.playerId);
      const deal = table.deals.find((d) => d.id === action.dealId);
      if (!p || !deal) break;
      if (deal.active || deal.declined || deal.broken) { error = "That deal is already settled."; break; }
      if (dealResponderId(deal) !== p.id) { error = "It's not your turn to answer this deal."; break; }
      if ((deal.counters ?? 0) >= MAX_COUNTERS) { error = "Too much back-and-forth — accept or decline."; break; }
      // counter the cash terms (and any other terms the client sent back)
      deal.terms = {
        ...deal.terms,
        creditsFromTo: action.terms.creditsFromTo ?? deal.terms.creditsFromTo,
        ...(action.terms.assetId !== undefined ? { assetId: action.terms.assetId } : {}),
        ...(action.terms.grantsPrecondition !== undefined ? { grantsPrecondition: action.terms.grantsPrecondition } : {}),
        ...(action.terms.investorCut !== undefined ? { investorCut: action.terms.investorCut } : {}),
      };
      deal.counters = (deal.counters ?? 0) + 1;
      // the counter-er has committed to these terms; the other side must answer
      if (p.id === deal.toPlayerId) { deal.confirmedTo = true; deal.confirmedFrom = false; }
      else { deal.confirmedFrom = true; deal.confirmedTo = false; }
      deal.lastActorId = p.id;
      const other = findPlayer(table, p.id === deal.toPlayerId ? deal.fromPlayerId : deal.toPlayerId);
      pushLog(table, "deal", `${p.name} countered ${other?.name}'s offer.`);
      break;
    }
    case "declineDeal": {
      const deal = table.deals.find((d) => d.id === action.dealId);
      if (!deal || deal.active || deal.declined) break;
      // refund the proposer's action — a turned-down offer shouldn't burn a turn
      const proposer = findPlayer(table, deal.fromPlayerId);
      if (proposer && deal.roundCreated === table.round && proposer.actionThisRound === "deal") {
        proposer.actionThisRound = null;
      }
      deal.declined = true;
      deal.active = false;
      const t = findPlayer(table, deal.toPlayerId);
      pushLog(table, "deal", `${t?.name} declined ${proposer?.name}'s offer.`);
      break;
    }
    case "cancelDeal": {
      const deal = table.deals.find((d) => d.id === action.dealId);
      if (!deal) break;
      // Agreed deals are binding: you can only withdraw a proposal that hasn't
      // been accepted yet (or one that's already broken/declined — a no-op).
      if (deal.active) { error = "That deal is locked in — agreed deals can't be cancelled."; break; }
      // refund the proposer's action if they withdraw a deal they proposed this round
      const proposer = findPlayer(table, deal.fromPlayerId);
      if (proposer && action.playerId === proposer.id && deal.roundCreated === table.round && proposer.actionThisRound === "deal") {
        proposer.actionThisRound = null;
      }
      deal.declined = true;
      deal.active = false;
      recomputeUnlocks(table);
      break;
    }
    case "advancePhase": {
      // One host click ends the round: lock everyone's stack, resolve the
      // off-switch + scoring, then open the next round (or finish the game).
      // The off-switch dice and the new world event surface as overlays in the
      // UI — there are no manual phase steps anymore.
      if (table.phase === "lobby" || table.phase === "final") break;

      // a deal still mid-negotiation with a human must be settled before the round ends
      const awaitingHuman = table.deals.some((d) => {
        if (d.roundCreated !== table.round) return false;
        const r = dealResponderId(d);
        return !!r && !!findPlayer(table, r)?.isHuman;
      });
      if (awaitingHuman) {
        error = "A deal is still on the table — it must be accepted or declined before the round ends.";
        break;
      }

      // lock built layers at the end of the round
      for (const p of table.players) {
        for (const layer of Object.keys(p.picks) as LayerId[]) {
          if (!p.lockedLayers.includes(layer)) p.lockedLayers.push(layer);
        }
      }

      enterPhase(table, "off-switch"); // rolls the dice → table.lastRoll (revealed in UI)
      scoreTick(table); // running scores update (and write to the leaderboard)

      if (table.round < CONFIG.totalRounds) {
        // deactivate one-off (non-standing) deals before the next round, but
        // keep access/unlock deals alive — the access they grant is ongoing, and
        // proposing one costs your action, so you build with it the following round.
        for (const d of table.deals)
          if (!d.standing && !d.terms.lease && !d.terms.grantsPrecondition) d.active = false;
        table.round += 1;
        enterPhase(table, "market-open"); // draws the next event, resets actions
        enterPhase(table, "build"); // back to the single action phase
      } else {
        table.phase = "final";
      }
      break;
    }
    case "resetTable": {
      // keep the shared event seed so a re-played table stays synced with the event
      const fresh = newTable(table.code, undefined, table.eventSeed);
      Object.assign(table, fresh);
      break;
    }
  }

  // bots answer any deal now waiting on them, instantly (offer → counter → settle)
  if (table.phase !== "lobby" && table.phase !== "final") resolveBotDeals(table);

  // keep running scores live so the round panel + leaderboard always reflect
  // the current board (scoreTick is idempotent: it recomputes from scratch).
  if (table.phase !== "lobby" && table.phase !== "final") scoreTick(table);

  table.updatedAt = Date.now();
  return { error };
}
