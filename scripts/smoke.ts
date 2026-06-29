// End-to-end smoke test: two WebSocket clients join one table on the live
// server, pick regions, and play all five rounds. Verifies real multiplayer
// sync (state broadcasts to both) and that scores land on the leaderboard.
import { WebSocket } from "ws";
import type { TableState, LeaderboardRow } from "../src/data/types";

const URL = process.env.WS ?? "ws://localhost:8787";
const CODE = "SMOKE-1";

function client(name: string) {
  const ws = new WebSocket(URL);
  let table: TableState | null = null;
  let leaderboard: LeaderboardRow[] = [];
  const ready = new Promise<void>((res) => ws.once("open", () => res()));
  ws.on("message", (raw) => {
    const m = JSON.parse(raw.toString());
    if (m.t === "state") table = m.table;
    if (m.t === "leaderboard") leaderboard = m.rows;
  });
  return {
    ws, ready,
    get table() { return table; },
    get leaderboard() { return leaderboard; },
    send: (o: unknown) => ws.send(JSON.stringify(o)),
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const a = client("Amara");
  const b = client("Bo");
  await Promise.all([a.ready, b.ready]);

  const pa = "p-amara";
  const pb = "p-bo";
  a.send({ t: "join", code: CODE, playerId: pa, name: "Amara" });
  b.send({ t: "join", code: CODE, playerId: pb, name: "Bo" });
  await sleep(150);

  // pick regions (Amara = France sovereign, Bo = Gulf money/dealer)
  a.send({ t: "action", code: CODE, action: { type: "pickRegion", playerId: pa, regionId: "france" } });
  b.send({ t: "action", code: CODE, action: { type: "pickRegion", playerId: pb, regionId: "gulf-swf" } });
  await sleep(150);

  if (a.table?.players.length !== 2) throw new Error("both players not synced to table A");
  if (b.table?.players.length !== 2) throw new Error("both players not synced to table B");
  console.log(`✓ both clients see ${a.table?.players.length} players at ${CODE}`);

  // host (Amara, first joiner) starts
  a.send({ t: "action", code: CODE, action: { type: "startGame" } });
  await sleep(150);
  console.log(`✓ game started, phase=${a.table?.phase}, round=${a.table?.round}, event=${a.table?.eventId}`);

  // Amara builds a sovereign open stack — ONE layer per round (weights before its dependents)
  const aBuilds: [string, string][] = [
    ["weights", "w-mistral"],
    ["compute", "co-nuclear"],
    ["model", "m-finetune"],
    ["chips", "c-sovereign-chips"],
    ["hosting", "h-open-ecosystem"],
  ];
  // Bo (Gulf) rents everything closed/foreign — should get crushed by sovereignty + die
  const bBuilds: [string, string][] = [
    ["weights", "w-closed-partner"],
    ["compute", "co-foreign-hyperscaler"],
    ["model", "m-wrap-closed"],
    ["chips", "c-chinese"],
    ["hosting", "h-foreign-cloud"],
  ];

  // play 5 rounds — each round opens directly on the single action phase, so
  // every player takes ONE action (build), then the host ends the round with a
  // single advancePhase that resolves the off-switch + scoring + next round.
  for (let r = 1; r <= 5; r++) {
    const [aLayer, aOpt] = aBuilds[r - 1];
    a.send({ t: "action", code: CODE, action: { type: "setPick", playerId: pa, layer: aLayer, optionId: aOpt } as never });
    const [bLayer, bOpt] = bBuilds[r - 1];
    b.send({ t: "action", code: CODE, action: { type: "setPick", playerId: pb, layer: bLayer, optionId: bOpt } as never });
    await sleep(80);

    a.send({ t: "action", code: CODE, action: { type: "advancePhase", playerId: pa } }); // ends round: off-switch + score + next round/final
    await sleep(80);
  }

  await sleep(200);
  console.log(`✓ final phase=${a.table?.phase}`);
  const amara = a.table?.players.find((p) => p.id === pa)!;
  const bo = a.table?.players.find((p) => p.id === pb)!;
  console.log(`\n  Amara (France, sovereign+open): adoption=${amara.score.rawAdoption} coh=${amara.score.coherence.toFixed(2)} sov=${amara.score.sovereignty.toFixed(2)} deals=${amara.score.deals} frag=${amara.score.fragilityPenalty} → FINAL ${amara.score.final}`);
  console.log(`  Bo (Gulf, all rented/closed):   adoption=${bo.score.rawAdoption} coh=${bo.score.coherence.toFixed(2)} sov=${bo.score.sovereignty.toFixed(2)} deals=${bo.score.deals} frag=${bo.score.fragilityPenalty} → FINAL ${bo.score.final}`);
  console.log(`\n  Leaderboard:`, a.leaderboard.map((r) => `${r.name}:${r.score}`).join("  "));

  if (a.leaderboard.length !== 2) throw new Error("leaderboard missing players");
  console.log(`\n${amara.score.final > bo.score.final ? "✓ INTENDED LESSON HOLDS: sovereign+open beat all-rented." : "⚠ rented stack out-scored sovereign — retune numbers."}`);

  a.ws.close();
  b.ws.close();
}

main().then(() => process.exit(0)).catch((e) => { console.error("✗ SMOKE FAILED:", e); process.exit(1); });
