import { useEffect } from "react";
import { useGame } from "../../store/useGame";
import { LAYERS, OPTION_BY_ID } from "../../data/layers";
import { REGION_BY_ID } from "../../data/regions";
import { exposedLayers } from "../../engine/offswitch";
import { RegionBarometer } from "../dash/RegionBarometer";
import { Term } from "../Term";
import { credits } from "../util";
import {
  LAYER_ICON, TrendUp, ShieldCheck, Warning, Prohibit,
  Coins, Handshake, Check, X,
} from "../icons";

// stack order, base → top (chips … hosting)
const STACK = [...LAYERS];

export function InspectOverlay() {
  const table = useGame((s) => s.table)!;
  const playerId = useGame((s) => s.playerId);
  const inspectId = useGame((s) => s.inspectPlayerId);
  const open = useGame((s) => s.inspectOpen);
  const close = useGame((s) => s.closeInspect);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const p = table.players.find((x) => x.id === inspectId);
  if (!open || !p) return null;

  const region = REGION_BY_ID[p.regionId];
  const exposed = new Set(exposedLayers(p).map((e) => e.layer));
  const isMe = p.id === playerId;
  const deals = table.deals.filter((d) => d.active && !d.broken && (d.fromPlayerId === p.id || d.toPlayerId === p.id));

  return (
    <div className="event-overlay inspect-overlay" onClick={close}>
      <div className={`inspect-card card offset c-${p.color}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`${p.name}'s stack`}>
        <button className="event-x btn btn-sm btn-ghost" onClick={close} aria-label="Close"><X size={16} /></button>

        <div className="insp-head">
          <span className="np-dot spot-bg" />
          <div className="grow">
            <div className="insp-name display">{region?.flag} {p.name} {isMe && <span className="you-badge">you</span>}</div>
            <div className="tiny muted">{region?.name}{p.isHuman ? "" : " · bot"}</div>
          </div>
          <div className="insp-score">
            <span className="tiny upper muted">Score</span>
            <span className="display tnum">{p.score.final}</span>
          </div>
        </div>

        <div className="insp-stats tiny">
          <span className="rs"><Coins size={13} /> {credits(p.credits)}</span>
          <span className="rs"><Handshake size={13} /> {deals.length} deal{deals.length === 1 ? "" : "s"}</span>
          <span className="rs">{Object.keys(p.picks).length}/5 built</span>
          {exposed.size > 0 && <span className="rs warn-text"><Warning size={13} /> {exposed.size} exposed</span>}
        </div>

        <RegionBarometer regionId={p.regionId} />

        <div className="bs-title tiny upper muted">Their stack</div>
        <ul className="insp-stack">
          {STACK.map((l) => {
            const optId = p.picks[l.id];
            const opt = optId ? OPTION_BY_ID[optId] : undefined;
            const Icon = LAYER_ICON[l.id];
            const isExp = exposed.has(l.id);
            return (
              <li key={l.id} className={`insp-row ${opt ? "built" : "empty"} ${isExp ? "exposed" : ""}`}>
                <span className="insp-ico"><Icon size={20} /></span>
                <span className="insp-body">
                  <span className="insp-layer tiny mono">{l.index} · <Term id={l.id}>{l.name}</Term></span>
                  {opt ? (
                    <>
                      <span className="insp-opt">{opt.name}</span>
                      <span className="insp-meta">
                        <span className="meter adopt"><TrendUp size={12} /> <b>{opt.adoption > 0 ? `+${opt.adoption}` : opt.adoption}</b></span>
                        <span className={`meter sov ${opt.sovereignty < 0 ? "neg" : ""}`}><ShieldCheck size={12} /> <b>{opt.sovereignty > 0 ? `+${opt.sovereignty}` : opt.sovereignty}</b></span>
                        {opt.exposure !== "none" && <span className="chip-tag warn"><Warning size={11} /> exposed</span>}
                        {opt.sanctionRisk && <span className="chip-tag warn"><Prohibit size={11} /> sanction</span>}
                      </span>
                    </>
                  ) : (
                    <span className="insp-opt muted">— not built yet —</span>
                  )}
                </span>
                {opt && <Check size={16} className="insp-check" />}
              </li>
            );
          })}
        </ul>

        {deals.length > 0 && (
          <p className="tiny muted insp-deals">In {deals.length} active deal{deals.length === 1 ? "" : "s"} at the table.</p>
        )}
      </div>
    </div>
  );
}
