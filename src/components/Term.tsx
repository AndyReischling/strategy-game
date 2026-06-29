import { useId, useState, useRef, useCallback, type ReactNode } from "react";
import { GLOSSARY_BY_ID } from "../data/glossary";

// §7a — the only learn-more mechanism. Dotted underline; hover/tap reveals a
// short two-tier card (plain definition + why it matters). Keyboard + SR friendly.
export function Term({ id, children }: { id: string; children?: ReactNode }) {
  const entry = GLOSSARY_BY_ID[id];
  const cardId = useId();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number; above: boolean }>({ x: 0, y: 0, above: false });
  const ref = useRef<HTMLButtonElement>(null);

  const place = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const above = r.top > 180;
    setPos({ x: Math.min(Math.max(r.left, 12), window.innerWidth - 272), y: above ? r.top - 8 : r.bottom + 8, above });
  }, []);

  const show = useCallback(() => { place(); setOpen(true); }, [place]);
  const hide = useCallback(() => setOpen(false), []);

  if (!entry) return <>{children ?? id}</>;

  return (
    <>
      <button
        ref={ref}
        type="button"
        className="term"
        aria-describedby={open ? cardId : undefined}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={(e) => { e.stopPropagation(); open ? hide() : show(); }}
      >
        {children ?? entry.term}
      </button>
      {open && (
        <span
          id={cardId}
          role="tooltip"
          className="term-card"
          style={{ left: pos.x, top: pos.y, transform: pos.above ? "translateY(-100%)" : "none" }}
        >
          <span className="t-name">{entry.term}</span>
          <div className="t-plain">{entry.plain}</div>
          <div className="t-why"><b>Why it matters:</b> {entry.why}</div>
        </span>
      )}
    </>
  );
}
