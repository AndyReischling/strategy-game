import { callClaude, extractJson, json } from "./_anthropic";

export const config = { runtime: "edge" };

// The VC: judges a two-sentence pitch against the player's actual stack. A
// strong, specific, credible pitch can sway the decision; vague hype can't.
// Hard floors (too early / raise cap) are still enforced by the game engine,
// so this only swings the believable middle.
export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  let body: { pitch?: string; stack?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad json" }, 400);
  }
  const pitch = String(body.pitch ?? "").slice(0, 600);
  const stack = body.stack ?? {};

  const system =
    "You are a hard-nosed venture capitalist in a turn-based strategy game about building sovereign AI stacks. " +
    "A player pitches you in two sentences to raise capital. Judge them on the credibility and specificity of the pitch AND the strength/coherence/sovereignty of their actual stack (provided). " +
    "A sharp, specific, defensible pitch can win funding even for a middling stack; vague hype or an incoherent/over-exposed stack should be declined. " +
    "If funded, amount is an integer 3-8 Credits (bigger for a stronger, more sovereign plan). " +
    "Write a punchy 1-2 sentence in-character reaction that references something concrete from their pitch or stack. " +
    'Respond with ONLY minified JSON: {"funded":boolean,"amount":integer,"reason":string}';

  const user = `Player stack: ${JSON.stringify(stack)}\nTheir pitch: "${pitch}"`;

  try {
    const text = await callClaude({ system, user, maxTokens: 300 });
    const parsed = extractJson<{ funded?: boolean; amount?: number; reason?: string }>(text);
    return json({
      funded: !!parsed.funded,
      amount: Math.max(0, Math.round(Number(parsed.amount) || 0)),
      reason: String(parsed.reason ?? "").slice(0, 240),
    });
  } catch (e) {
    return json({ error: String(e) }, 502);
  }
}
