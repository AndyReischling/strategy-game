import { useEffect } from "react";
import { useGame } from "../store/useGame";
import { CONFIG } from "../data/config";
import { credits } from "./util";
import { Term } from "./Term";
import {
  Hammer, Handshake, Power, ArrowRight, X, Check,
  Cpu, Lightning, Wrench, Package, DeviceMobile,
} from "./icons";
import type { Icon } from "./icons";

const STEPS: { icon: Icon; name: string; analogy: string; term: string }[] = [
  { icon: Cpu, name: "Chips", analogy: "the engine", term: "chips" },
  { icon: Lightning, name: "Compute", analogy: "the powered building", term: "compute" },
  { icon: Wrench, name: "Model", analogy: "how you make the AI", term: "model" },
  { icon: Package, name: "Weights", analogy: "the recipe — own it or rent it", term: "weights" },
  { icon: DeviceMobile, name: "Hosting", analogy: "how people get it", term: "hosting" },
];

export function HowToPlay() {
  const show = useGame((s) => s.showHowTo);
  const toggle = useGame((s) => s.toggleHowTo);
  const close = () => toggle(false);

  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  if (!show) return null;

  return (
    <div className="howto-backdrop" onClick={close}>
      <div className="howto card offset c-yellow" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="How to play">
        <button className="howto-x btn btn-sm btn-ghost" onClick={close} aria-label="Close"><X size={16} /></button>

        <div className="howto-page">
          <div className="howto-kicker mono upper tiny">How to play</div>
          <h2 className="howto-title">Build an AI the world uses</h2>
          <p className="howto-lead">
            You play a region racing to build a sovereign alternative to the big US AI companies.
            <b> Everyone starts with the same {credits(CONFIG.startingBudget)}</b> — your edge is what your region <i>has</i>:
            cheap power, talent, a key factory, a big market. Use what you have, buy what you don't, and deal for the rest.
          </p>

          <p className="howto-mini-h mono upper tiny">Your stack — pick one option per layer (you need all five)</p>
          <ul className="howto-steps">
            {STEPS.map((s, i) => (
              <li key={s.name} className="howto-step">
                <span className="hs-num mono">{i + 1}</span>
                <span className="hs-ico"><s.icon size={20} /></span>
                <span className="hs-head"><Term id={s.term}>{s.name}</Term> <span className="hs-analogy">— {s.analogy}</span></span>
              </li>
            ))}
          </ul>

          <div className="howto-loop">
            <div className="loop-step"><span className="loop-ico"><Hammer size={24} /></span><b>Build</b><span className="tiny">a layer</span></div>
            <ArrowRight size={18} className="loop-arrow" />
            <div className="loop-step"><span className="loop-ico"><Handshake size={24} /></span><b>Deal</b><span className="tiny">to fill gaps</span></div>
            <ArrowRight size={18} className="loop-arrow" />
            <div className="loop-step"><span className="loop-ico"><Power size={24} /></span><b>Watch</b><span className="tiny">the dice</span></div>
          </div>
          <p className="tiny muted">Each round you take <b>one action</b> — build a layer, strike a deal, or pitch General Catalyst for capital — over {CONFIG.totalRounds} rounds.</p>

          <p className="howto-mini-h mono upper tiny">Your moves each round (pick one)</p>
          <p className="tiny muted" style={{ margin: "0 0 0.6rem" }}>
            <b>Build</b> one layer (buy units of chips/datacenters, or pick a model/weights/hosting) · <b>Deal</b> with other players (free — doesn't use your build) · <b>Pitch</b> General Catalyst for cash (burns your turn if they pass).
          </p>

          <p className="howto-mini-h mono upper tiny">Your hand — and how to fill the gaps</p>
          <p className="tiny muted" style={{ margin: "0 0 0.6rem", lineHeight: 1.5 }}>
            The barometer shows what your region is <b>Strong</b> or <b>Short on</b>. You fill gaps by building, or by dealing for what you lack:
            <br /><b>Chips / Compute</b> — buy units in Layers 1–2, or trade for spare units. <b>Talent</b> isn't a layer you buy — it makes building your <i>own</i> model cheaper, so if you're short on it, adapt an open model (fine-tune/localize) instead of training from scratch, or buy a model from a talent-rich partner (e.g. Canada). <b>Weights</b> — pick an open base you own (Layer 4) or get one granted. <b>Market</b> — reach users in Layer 5; short on it? deal for a market channel (Germany/India). <b>Capital</b> — pitch General Catalyst or take a backer (Gulf/Nordics).
          </p>

          <div className="howto-rule card c-orange">
            <Power size={20} />
            <p><b>How you win:</b> score = users you reach × how well your stack fits together × how much you <i>own</i> it, plus good deals. Owned stacks survive the off-switch dice; rented ones get switched off. Build something you <b>own</b>, that people <b>use</b>, with <b>partners</b> you can count on.</p>
          </div>
        </div>

        <div className="howto-nav">
          <div className="grow" />
          <button className="btn btn-sm btn-go" onClick={close}>Got it <Check size={15} /></button>
        </div>
      </div>
    </div>
  );
}
