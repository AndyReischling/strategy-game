import { REGION_BY_ID } from "../../data/regions";
import type { StrengthDim } from "../../data/types";
import { Cpu, Lightning, Brain, Package, Storefront, Coins } from "../icons";
import type { Icon } from "../icons";

// The dashboard barometer: your region's structural hand across the six things
// a working AI stack needs. Makes "you have talent but no chips" legible at a glance.
const DIMS: { id: StrengthDim; label: string; icon: Icon; hint: string }[] = [
  { id: "chips", label: "Chips", icon: Cpu, hint: "Access to the processors AI runs on (Layer 1)." },
  { id: "compute", label: "Compute", icon: Lightning, hint: "Cheap power + clusters to run them (Layer 2)." },
  { id: "talent", label: "Talent", icon: Brain, hint: "Researchers to build & improve models (Layer 3)." },
  { id: "weights", label: "Weights", icon: Package, hint: "An owned model to build on (Layer 4)." },
  { id: "market", label: "Market", icon: Storefront, hint: "Distribution to reach real users (Layer 5)." },
  { id: "capital", label: "Capital", icon: Coins, hint: "Spending power to buy what you lack." },
];

const LABEL = (n: number) => (n <= -1 ? "short" : n >= 3 ? "dominant" : n === 2 ? "strong" : n === 1 ? "ok" : "none");

export function RegionBarometer({ regionId, title = true }: { regionId: string; title?: boolean }) {
  const region = REGION_BY_ID[regionId];
  if (!region) return null;
  const s = region.strengths;
  const strong = DIMS.filter((d) => s[d.id] >= 2).map((d) => d.label);
  const short = DIMS.filter((d) => s[d.id] <= -1).map((d) => d.label);

  return (
    <div className={`barometer c-${region.color}`}>
      {title && (
        <div className="baro-head">
          <span className="baro-title tiny upper">{region.flag} {region.name} — your hand</span>
        </div>
      )}
      <div className="baro-rows">
        {DIMS.map((d) => {
          const v = s[d.id];
          const filled = Math.max(0, v + 1); // -1->0 … 3->4
          const tone = v <= -1 ? "short" : v >= 2 ? "strong" : "mid";
          const Icon = d.icon;
          return (
            <div className={`baro-row ${tone}`} key={d.id} title={`${d.label}: ${LABEL(v)} — ${d.hint}`}>
              <span className="baro-ico"><Icon size={14} /></span>
              <span className="baro-label">{d.label}</span>
              <span className="baro-track" aria-label={`${d.label}: ${LABEL(v)}`}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <span key={i} className={`baro-seg ${i < filled ? "on" : ""}`} />
                ))}
              </span>
            </div>
          );
        })}
      </div>
      <div className="baro-summary tiny">
        {strong.length > 0 && <span><b className="good-text">Strong:</b> {strong.join(", ")}</span>}
        {short.length > 0 && <span><b className="warn-text">Short on:</b> {short.join(", ")}</span>}
        <span className="muted baro-fill">Fill the gaps at the deal table.</span>
      </div>
    </div>
  );
}
