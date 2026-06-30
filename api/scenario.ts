import { callClaude, extractJson, json } from "./_anthropic";

export const config = { runtime: "edge" };

// The procedural world: reads the political/market implications of what players
// did this game so far and invents ONE world event for the coming round, mapped
// onto the game's real mechanics. The engine re-validates and clamps everything,
// so the model can shape the believable middle but never break balance.
export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  let body: { board?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad json" }, 400);
  }
  const board = body.board ?? {};

  const system =
    "You are the world reacting to a turn-based strategy game about middle powers building SOVEREIGN AI stacks (chips → compute → model → weights → hosting) to rival US tech giants. " +
    "You are given the current board: each player's region, what they've built, how sovereign vs. dependent they are, who's exposed, their capital, and the active deals/alliances. " +
    "Read the POLITICAL and PRIVATE-CAPITAL implications of these moves and invent ONE plausible world event for the coming round — e.g. Nvidia subsidizes compute to undercut a forming coalition, an export-control tightens, a sovereign fund floods in, an energy crunch hits, an open-weights drop resets the model layer. Be specific and grounded in real 2025–2026 AI-geopolitics dynamics (use web search if helpful). " +
    "Express the event's bite as structured EFFECTS using ONLY these kinds: " +
    "surcharge-tag (amount $B added to options with given tags), discount-tag (amount $B off), freeze-precondition (blocks a precondition this round), double-sanction (tags), exposure-bonus (extra off-switch scar for tags), deal-bonus (amount points per active deal), offswitch-twice (rolls the off-switch twice), trust-hit-rushed (amount adoption lost by rushed/cheap models), unreliable-rented (rented/foreign may not deliver), swf-stipend (amount $B if you take a backer). " +
    "Useful tags: nvidia, chinese, domestic-build, renewable, nuclear, rented, foreign, open, finetune, continued, model-build, consumer-app, enterprise, sovereign, owned. " +
    "Useful preconditions: supply-allocation, deal-compute, market-channel, high-power, renewable-power. " +
    "Keep amounts modest: surcharge/discount 1–6, deal-bonus 1–3, trust-hit 1–3, swf-stipend 10–40. Use 1–3 effects. Reflect WHO it hits based on the board (you may target tags or exempt regions via exemptRegionIds). " +
    "Write the name, flavor and effectText in PLAIN, SIMPLE language anyone can understand — short words, no jargon or acronyms, like explaining the news to a smart teenager. The effectText must say in one clear sentence exactly what changes for players. " +
    'Respond with ONLY minified JSON: {"name":string(<=4 words),"flavor":string(one evocative sentence),"effectText":string(one plain sentence of the mechanical effect),"effects":[{"kind":string,"tags"?:string[],"amount"?:number,"preconditions"?:string[],"optionIds"?:string[],"exemptRegionIds"?:string[],"exemptTags"?:string[]}]}';

  const user = `Board:\n${JSON.stringify(board)}`;
  const webTool = [{ type: "web_search_20250305", name: "web_search", max_uses: 2 }];

  try {
    let text: string;
    try {
      text = await callClaude({ system, user, maxTokens: 900, tools: webTool });
    } catch {
      text = await callClaude({ system, user, maxTokens: 700 });
    }
    const parsed = extractJson<{ name?: string; flavor?: string; effectText?: string; effects?: unknown[] }>(text);
    return json({
      name: String(parsed.name ?? "").slice(0, 60),
      flavor: String(parsed.flavor ?? "").slice(0, 240),
      effectText: String(parsed.effectText ?? "").slice(0, 240),
      effects: Array.isArray(parsed.effects) ? parsed.effects.slice(0, 4) : [],
    });
  } catch (e) {
    return json({ error: String(e) }, 502);
  }
}
