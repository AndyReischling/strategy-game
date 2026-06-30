import { Term } from "../Term";
import { TrendUp, ShieldCheck } from "../icons";

// A qualitative strength indicator (direction + low/med/high pips) — never the
// exact number, so players weigh trade-offs without min-maxing a visible score.
export function StrengthMeter({ value, kind, withTerm = true }: { value: number; kind: "adopt" | "sov"; withTerm?: boolean }) {
  const neg = value < 0;
  const Icon = kind === "adopt" ? TrendUp : ShieldCheck;
  const label = kind === "adopt" ? "adoption" : "sovereignty";
  // adoption spans ~0–6 (bucket by 2); sovereignty spans ~−2–3 (bucket by 1)
  const level = value === 0 ? 0 : Math.min(3, Math.ceil(Math.abs(value) / (kind === "adopt" ? 2 : 1)));
  const word = level === 0 ? "neutral" : level === 1 ? "low" : level === 2 ? "med" : "high";
  const inner = (
    <span className={`meter ${kind} ${neg ? "neg" : ""}`} aria-label={`${neg ? "negative " : ""}${label}: ${word}`}>
      <Icon size={13} />
      <span className="meter-pips">{[0, 1, 2].map((i) => <span key={i} className={`mp ${i < level ? "on" : ""}`} />)}</span>
      <span className="meter-label">{neg ? `−${label}` : label}</span>
    </span>
  );
  return withTerm ? <Term id={kind === "adopt" ? "adoption" : "sovereignty"}>{inner}</Term> : inner;
}
