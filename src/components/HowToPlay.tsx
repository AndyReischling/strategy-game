import { useState, useEffect } from "react";
import { useGame } from "../store/useGame";
import { Term } from "./Term";
import {
  Hammer, Handshake, Power, ArrowRight, ArrowLeft, X, Check,
  Cpu, Lightning, Wrench, Package, DeviceMobile, ShieldCheck, Sparkle,
} from "./icons";
import type { Icon } from "./icons";

const STEPS: { icon: Icon; name: string; analogy: string; line: string; term: string; importance: number; role: string }[] = [
  { icon: Cpu, name: "Chips", analogy: "the engine", line: "The special, powerful parts your AI runs on. Almost nobody makes good ones — so they're the hardest thing to get.", term: "chips", importance: 2, role: "The scarce foundation" },
  { icon: Lightning, name: "Compute", analogy: "the powered building", line: "Chips do nothing without a building full of electricity to run them. This is that building.", term: "compute", importance: 2, role: "Sets how big you can build" },
  { icon: Wrench, name: "Model", analogy: "the cooking", line: "How you make the AI: build one from scratch, improve a free one, or just rent someone else's.", term: "model", importance: 2, role: "The AI itself" },
  { icon: Package, name: "Weights", analogy: "a recipe you own", line: "The actual AI saved as a file. Own a copy and it's yours forever. Rent it and the owner can pull the plug.", term: "weights", importance: 3, role: "Decides if you OWN it — your independence" },
  { icon: DeviceMobile, name: "Hosting", analogy: "the storefront", line: "How real people actually get your AI. This is where you win or lose the race for users.", term: "hosting", importance: 3, role: "How you reach users — scored on most" },
];

export function HowToPlay() {
  const show = useGame((s) => s.showHowTo);
  const toggle = useGame((s) => s.toggleHowTo);
  const [page, setPage] = useState(0);

  const pages = 3;
  const close = () => { toggle(false); setPage(0); };

  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") setPage((p) => Math.min(pages - 1, p + 1));
      if (e.key === "ArrowLeft") setPage((p) => Math.max(0, p - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  if (!show) return null;

  return (
    <div className="howto-backdrop" onClick={close}>
      <div className="howto card offset c-yellow" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="How to play">
        <button className="howto-x btn btn-sm btn-ghost" onClick={close} aria-label="Close"><X size={16} /></button>

        {page === 0 && (
          <div className="howto-page">
            <div className="howto-kicker mono upper tiny">How to play · 1 of {pages}</div>
            <h2 className="howto-title">The big idea</h2>
            <p className="howto-lead">
              A giant American AI (think ChatGPT) is already the best in the world. You <b>can't</b> beat it at being
              the smartest. So you beat it a different way: build the AI <b>the most people actually use</b> — and
              that <b>can't be <Term id="off-switch">switched off</Term></b> by anyone else.
            </p>
            <p className="howto-lead">
              You play a country or region. <b>Everyone starts with the same money.</b> What's different is what your
              region <i>has</i> — cheap electricity, brilliant scientists, a key factory, a big market. Use what you
              have, buy what you don't, and make deals for the rest.
            </p>
            <div className="howto-loop">
              <div className="loop-step"><span className="loop-ico"><Hammer size={26} /></span><b>Build</b><span className="tiny">pick how you'll make your AI</span></div>
              <ArrowRight size={20} className="loop-arrow" />
              <div className="loop-step"><span className="loop-ico"><Handshake size={26} /></span><b>Deal</b><span className="tiny">trade to fill your gaps</span></div>
              <ArrowRight size={20} className="loop-arrow" />
              <div className="loop-step"><span className="loop-ico"><Power size={26} /></span><b>Watch</b><span className="tiny">the dice test your shortcuts</span></div>
            </div>
            <p className="tiny muted">Each round you take <b>one action</b>: buy a piece of infrastructure, pitch a VC for capital (two sentences — they can say no), or strike a deal with another player. (Accepting an offer someone sends you is always free.) Then the round ends, an event hits, and round 2 begins — your stack and coalition come together over five rounds.</p>
          </div>
        )}

        {page === 1 && (
          <div className="howto-page">
            <div className="howto-kicker mono upper tiny">How to play · 2 of {pages}</div>
            <h2 className="howto-title">Build your AI in five steps</h2>
            <p className="howto-lead">Like building a sandwich, bottom to top — pick one option at each step. You don't have to finish all five in one round; build up over the game. The bars show how much each step <b>drives your score</b>.</p>
            <ul className="howto-steps">
              {STEPS.map((s, i) => (
                <li key={s.name} className="howto-step">
                  <span className="hs-num mono">{i + 1}</span>
                  <span className="hs-ico"><s.icon size={24} /></span>
                  <span className="hs-body">
                    <span className="hs-head">
                      <Term id={s.term}>{s.name}</Term> <span className="hs-analogy">— {s.analogy}</span>
                      <span className="hs-weight" title={`Importance: ${s.importance} of 3`} aria-label={`Importance ${s.importance} of 3`}>
                        {Array.from({ length: 3 }).map((_, k) => <span key={k} className={`hw-pip ${k < s.importance ? "on" : ""}`} />)}
                      </span>
                    </span>
                    <span className="hs-line tiny">{s.line}</span>
                    <span className="hs-role tiny">▸ {s.role}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="tiny muted howto-allfive">You need <b>all five</b> — leave a layer empty and your whole stack is capped. A chain is only as strong as its weakest link.</p>
          </div>
        )}

        {page === 2 && (
          <div className="howto-page">
            <div className="howto-kicker mono upper tiny">How to play · 3 of {pages}</div>
            <h2 className="howto-title">How you win</h2>
            <p className="howto-lead">At the end of five rounds, your AI is scored on four things:</p>
            <ul className="howto-win">
              <li><Sparkle size={18} className="win-ico" /><span><b>Users</b> — how many people use your AI <span className="muted">(the big one)</span>.</span></li>
              <li><Check size={18} className="win-ico" /><span><b>Does it fit together?</b> — a bonus if your five choices make sense as a set.</span></li>
              <li><ShieldCheck size={18} className="win-ico" /><span><b>Are you independent?</b> — a bonus for owning your stack; a penalty for borrowing things that can be switched off.</span></li>
              <li><Handshake size={18} className="win-ico" /><span><b>Did you make good deals?</b> — a bonus for trades that filled real gaps.</span></li>
            </ul>
            <div className="howto-rule card c-orange">
              <Power size={22} />
              <p><b>The golden rule:</b> owned AIs survive the dice. Rented or borrowed ones can get switched off. You don't win by being richest or smartest — you win by building something you <i>own</i>, that people <i>use</i>, with <i>partners</i> you can count on.</p>
            </div>
            <p className="tiny muted">Stuck on a word? Anything with a dotted underline — hover or tap it for a plain answer.</p>
          </div>
        )}

        <div className="howto-nav">
          <button className="btn btn-sm btn-ghost" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}><ArrowLeft size={15} /> Back</button>
          <div className="howto-dots">
            {Array.from({ length: pages }).map((_, i) => (
              <button key={i} className={`howto-dot ${i === page ? "on" : ""}`} onClick={() => setPage(i)} aria-label={`Page ${i + 1}`} />
            ))}
          </div>
          {page < pages - 1 ? (
            <button className="btn btn-sm btn-go" onClick={() => setPage((p) => p + 1)}>Next <ArrowRight size={15} /></button>
          ) : (
            <button className="btn btn-sm btn-go" onClick={close}>Got it <Check size={15} /></button>
          )}
        </div>
      </div>
    </div>
  );
}
