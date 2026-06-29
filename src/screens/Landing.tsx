import { useState } from "react";
import { useGame } from "../store/useGame";
import { Term } from "../components/Term";

const CODE_WORDS = ["OSLO", "PARIS", "DELFT", "NARVIK", "MUNICH", "LAGOS", "KYOTO", "TURIN"];
function randomCode() {
  const w = CODE_WORDS[Math.floor(Math.random() * CODE_WORDS.length)];
  return `${w}-${Math.floor(Math.random() * 9) + 1}`;
}

export function Landing() {
  const joinOnline = useGame((s) => s.joinOnline);
  const startLocal = useGame((s) => s.startLocal);
  const urlCode = new URLSearchParams(location.search).get("code") ?? "";
  const [name, setName] = useState("");
  const [code, setCode] = useState(urlCode);

  return (
    <div className="landing">
      <div className="landing-grain halftone" aria-hidden />
      <header className="landing-hero">
        <div className="hero-kicker mono upper">A turn-based strategy game · up to 6 per table · ~1 hour</div>
        <h1 className="hero-title">
          Sovereign<br />Stack
        </h1>
        <p className="hero-sub">
          A giant American AI already wins on raw capability. You win differently — build the AI the
          world actually <Term id="adoption">uses</Term>, and that can't be{" "}
          <Term id="off-switch">switched off</Term>. Pick a region, build your{" "}
          five-layer stack, and survive at the negotiation table.
        </p>
      </header>

      <div className="landing-panels">
        <section className="card landing-card offset c-yellow">
          <h2>Play online</h2>
          <p className="tiny muted">Everyone on their own phone or laptop. Share the table code; the leaderboard syncs across every table live.</p>
          <label className="field">
            <span>Your name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Amara" maxLength={20} />
          </label>
          <label className="field">
            <span>Table code</span>
            <div className="row gap-1">
              <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="OSLO-3" maxLength={12} />
              <button className="btn btn-sm" onClick={() => setCode(randomCode())} title="Make a new code">⟳</button>
            </div>
          </label>
          <div className="row gap-2" style={{ marginTop: "0.7rem" }}>
            <button className="btn btn-go grow" disabled={!code.trim()} onClick={() => joinOnline(code.trim(), name.trim() || "Player")}>
              {code.trim() ? "Join / host table" : "Enter a code"}
            </button>
          </div>
          <p className="tiny muted" style={{ marginTop: "0.6rem" }}>
            First to a code hosts it. Others join the same code to sit at that table.
          </p>
        </section>

        <section className="card landing-card offset c-blue">
          <h2>Practice solo</h2>
          <p className="tiny muted">Learn the loop against bots — no server needed. Add up to five AI rivals and run all five rounds.</p>
          <label className="field">
            <span>Your name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Amara" maxLength={20} />
          </label>
          <button className="btn btn-primary" style={{ marginTop: "0.7rem", width: "100%" }} onClick={() => startLocal(name.trim() || "You")}>
            Start practice game
          </button>
        </section>
      </div>

      <footer className="landing-foot tiny mono">
        <span>Adoption × Coherence × Sovereignty + Deals.</span>
        <span>The real adversary isn't the incumbent — it's coordination cost and nerve.</span>
      </footer>
    </div>
  );
}
