// Shared Anthropic (Claude) caller for the Edge functions. The API key lives
// only here (server-side env), never in the client bundle.

interface CallOpts {
  system?: string;
  user: string;
  maxTokens?: number;
  tools?: unknown[];
  model?: string;
}

export async function callClaude(opts: CallOpts): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set");
  const model = opts.model || process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

  const body: Record<string, unknown> = {
    model,
    max_tokens: opts.maxTokens ?? 600,
    messages: [{ role: "user", content: opts.user }],
  };
  if (opts.system) body.system = opts.system;
  if (opts.tools) body.tools = opts.tools;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`anthropic ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  return (data.content ?? [])
    .filter((b) => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text)
    .join("\n");
}

/** Pull the first JSON object/array out of a model response. */
export function extractJson<T = unknown>(text: string): T {
  const trimmed = text.trim();
  // strip ```json fences if present
  const fenced = trimmed.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = fenced.search(/[[{]/);
  if (start === -1) throw new Error("no JSON in response");
  const open = fenced[start];
  const close = open === "{" ? "}" : "]";
  const end = fenced.lastIndexOf(close);
  if (end === -1) throw new Error("unterminated JSON");
  return JSON.parse(fenced.slice(start, end + 1)) as T;
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}
