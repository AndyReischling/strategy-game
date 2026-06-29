import { useState } from "react";
import { useGame } from "../store/useGame";
import { CONFIG } from "../data/config";
import { Question } from "../components/icons";

const CODE_WORDS = ["OSLO", "PARIS", "DELFT", "NARVIK", "MUNICH", "LAGOS", "KYOTO", "TURIN"];
function randomCode() {
  const w = CODE_WORDS[Math.floor(Math.random() * CODE_WORDS.length)];
  return `${w}-${Math.floor(Math.random() * 9) + 1}`;
}

export function Landing() {
  const joinOnline = useGame((s) => s.joinOnline);
  const startLocal = useGame((s) => s.startLocal);
  const toggleHowTo = useGame((s) => s.toggleHowTo);
  const urlCode = new URLSearchParams(location.search).get("code") ?? "";
  const [name, setName] = useState("");
  const [code, setCode] = useState(urlCode);

  // The instruction manual opens when a player actually starts a game.
  const playOnline = () => {
    toggleHowTo(true);
    joinOnline(code.trim(), name.trim() || "Player");
  };
  const playSolo = () => {
    toggleHowTo(true);
    startLocal(name.trim() || "You");
  };

  return (
    <div className="landing">
      <div className="landing-grain halftone" aria-hidden />
      <button className="landing-help btn btn-sm" onClick={() => toggleHowTo(true)}><Question size={15} /> How to play</button>
      <header className="landing-hero">
        <div className="hero-kicker mono upper">A turn-based strategy game · up to 6 per table · ~1 hour</div>
        <h1 className="hero-title">
          Sovereign<br />Stack
        </h1>
        <p className="hero-sub">
          We already know that there are big American technology companies that have cornered the
          market for AI infrastructure. This has caused problems for middle power nations' sovereignty.
        </p>
        <p className="hero-sub">
          This game reimagines what a reconstituted coalition could look like: how would you build a
          competitor to the biggest companies on Earth?
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
            <button className="btn btn-go grow" disabled={!code.trim()} onClick={playOnline}>
              {code.trim() ? "Join / host table" : "Enter a code"}
            </button>
          </div>
          <p className="tiny muted" style={{ marginTop: "0.6rem" }}>
            First to a code hosts it. Others join the same code to sit at that table.
          </p>
        </section>

        <section className="card landing-card offset c-blue">
          <h2>Practice solo</h2>
          <p className="tiny muted">Learn the loop against bots — no server needed. Add up to five AI rivals and run all {CONFIG.totalRounds} rounds.</p>
          <label className="field">
            <span>Your name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Amara" maxLength={20} />
          </label>
          <button className="btn btn-primary" style={{ marginTop: "0.7rem", width: "100%" }} onClick={playSolo}>
            Start practice game
          </button>
        </section>
      </div>

      <footer className="landing-foot tiny mono">
        <span>Adoption × Coherence × Sovereignty + Deals.</span>
      </footer>
    </div>
  );
}
