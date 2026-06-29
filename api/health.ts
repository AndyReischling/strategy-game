// Lightweight status probe: lets the client tell whether the Anthropic key is
// actually set on the server (without spending an LLM call), so the UI can
// nudge you to add it.
export const config = { runtime: "edge" };

export default async function handler(): Promise<Response> {
  return new Response(
    JSON.stringify({
      ok: true,
      keyPresent: !!process.env.ANTHROPIC_API_KEY,
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
    }),
    { headers: { "content-type": "application/json", "cache-control": "no-store" } },
  );
}
