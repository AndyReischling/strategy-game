import { useGame } from "../store/useGame";
import { Warning, X } from "./icons";

// Visible nudge: the AI features are turned on, but the server has no Anthropic
// key — so pitches/events silently fall back to the deterministic engine.
export function LlmBanner() {
  const status = useGame((s) => s.llmStatus);
  const dismissed = useGame((s) => s.llmBannerDismissed);
  const dismiss = useGame((s) => s.dismissLlmBanner);

  if (!status || !status.enabled || status.keyPresent || dismissed) return null;

  return (
    <div className="llm-banner" role="status">
      <Warning size={18} />
      <span className="grow">
        AI features are on, but <code>ANTHROPIC_API_KEY</code> isn't set on the server.
        Add it in Vercel → Settings → Environment Variables, then redeploy. (Until then, General Catalyst &amp; events use the built-in logic.)
      </span>
      <button className="btn btn-sm" onClick={dismiss} aria-label="Dismiss"><X size={14} /></button>
    </div>
  );
}
