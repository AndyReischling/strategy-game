import { useMemo } from "react";
import { useGame } from "../store/useGame";
import { GLOSSARY } from "../data/glossary";

export function GlossaryDrawer() {
  const show = useGame((s) => s.showGlossary);
  const toggle = useGame((s) => s.toggleGlossary);

  const groups = useMemo(() => {
    const m = new Map<string, typeof GLOSSARY>();
    for (const g of GLOSSARY) {
      if (!m.has(g.group)) m.set(g.group, []);
      m.get(g.group)!.push(g);
    }
    return [...m.entries()];
  }, []);

  if (!show) return null;
  return (
    <div className="drawer-backdrop" onClick={() => toggle(false)}>
      <aside className="drawer card" onClick={(e) => e.stopPropagation()} aria-label="Glossary">
        <div className="row between" style={{ marginBottom: "0.6rem" }}>
          <h2 style={{ fontSize: "1.6rem" }}>Glossary</h2>
          <button className="btn btn-sm" onClick={() => toggle(false)}>Close ✕</button>
        </div>
        <p className="tiny muted" style={{ marginTop: 0 }}>
          Every dotted-underlined word in the game is defined here. The game uses real terms on
          purpose — but each is one tap from a plain answer.
        </p>
        {groups.map(([group, items]) => (
          <section key={group} className="gloss-group">
            <h3 className="upper tiny" style={{ color: "var(--orange)", marginBottom: "0.3rem" }}>{group}</h3>
            {items.map((g) => (
              <div key={g.id} className="gloss-row">
                <div className="gloss-term display">{g.term}</div>
                <div className="gloss-plain">{g.plain}</div>
                <div className="gloss-why tiny"><b>Why it matters:</b> {g.why}</div>
              </div>
            ))}
          </section>
        ))}
      </aside>
    </div>
  );
}
