import { callClaude, extractJson, json } from "./_anthropic";

export const config = { runtime: "edge" };

interface CardIn {
  id: string;
  name: string;
  effectText: string;
}

// Rewrites each round's world-event card with fresh flavor grounded in REAL,
// recent developments in AI sovereignty / compute / chips (via web search),
// WITHOUT changing the mechanical meaning — keeps balance & cross-table fairness
// intact while making every game read differently and feel current.
export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  let body: { cards?: CardIn[] };
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad json" }, 400);
  }
  const cards = (body.cards ?? []).slice(0, 8);
  if (cards.length === 0) return json({ flavor: {} });

  const system =
    "You write world-event cards for a strategy game about building sovereign AI stacks (chips, compute, models, weights, hosting, deals). " +
    "For each card you're given, write a fresh NAME (<= 4 words), a one-sentence in-world FLAVOR line (evocative, the voice of a tightening geopolitical squeeze), and a plain EFFECT line. " +
    "Ground them in real, recent (2025-2026) developments — Nvidia/ASML/Mistral/export controls/energy/sovereign funds/open weights — using web search where useful. " +
    "CRITICAL: keep the mechanical meaning of the provided effectText EXACTLY the same (same costs, same who's affected); only rephrase it. " +
    'Respond with ONLY minified JSON: an array of {"id":string,"name":string,"flavor":string,"effectText":string} for every card id given.';

  const user = `Cards:\n${cards.map((c) => `- ${c.id}: "${c.name}" — ${c.effectText}`).join("\n")}`;

  const webTool = [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }];

  const parse = (text: string) => {
    const arr = extractJson<Array<{ id: string; name?: string; flavor?: string; effectText?: string }>>(text);
    const out: Record<string, { name: string; flavor: string; effectText: string }> = {};
    for (const c of arr) {
      if (!c?.id) continue;
      out[c.id] = {
        name: String(c.name ?? "").slice(0, 60),
        flavor: String(c.flavor ?? "").slice(0, 240),
        effectText: String(c.effectText ?? "").slice(0, 240),
      };
    }
    return out;
  };

  try {
    let text: string;
    try {
      text = await callClaude({ system, user, maxTokens: 1500, tools: webTool });
    } catch {
      // web search unsupported / failed — fall back to plain generation
      text = await callClaude({ system, user, maxTokens: 1200 });
    }
    return json({ flavor: parse(text) });
  } catch (e) {
    return json({ error: String(e) }, 502);
  }
}
