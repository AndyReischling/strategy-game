import type { Player, LayerId } from "../../data/types";
import { LAYERS, OPTION_BY_ID } from "../../data/layers";
import { exposedLayers } from "../../engine/offswitch";
import { LAYER_ICON, Warning, Check, CaretRight } from "../icons";

// The stack, rendered as a literal stack of blocks (hosting on top → chips at
// the base, like building a sandwich). This is the central turn metaphor.
const TOP_DOWN = [...LAYERS].reverse();

interface Props {
  player: Player;
  interactive?: boolean;
  selectedLayer?: LayerId | null;
  onSelect?: (l: LayerId) => void;
  compact?: boolean;
}

export function StackColumn({ player, interactive, selectedLayer, onSelect, compact }: Props) {
  const exposed = new Set(exposedLayers(player).map((e) => e.layer));

  if (compact) {
    return (
      <div className={`stack-compact c-${player.color}`}>
        {TOP_DOWN.map((l) => {
          const opts = (player.picks[l.id] ?? []).map((id) => OPTION_BY_ID[id]).filter(Boolean);
          const Icon = LAYER_ICON[l.id];
          return (
            <span
              key={l.id}
              className={`sc-cell ${opts.length ? "filled" : "empty"} ${exposed.has(l.id) ? "exp" : ""}`}
              title={opts.length ? `${l.name}: ${opts.map((o) => o.name).join(", ")}` : `${l.name}: empty`}
            >
              <Icon size={13} />
            </span>
          );
        })}
      </div>
    );
  }

  const moveUsed = interactive && !!player.actionThisRound;
  return (
    <div className={`stack-col c-${player.color}`}>
      {TOP_DOWN.map((l) => {
        const opts = (player.picks[l.id] ?? []).map((id) => OPTION_BY_ID[id]).filter(Boolean);
        const units = Object.values(player.qty[l.id] ?? {}).reduce((a, b) => a + b, 0);
        const built = opts.length > 0;
        const label = built
          ? opts[0].name + (opts.length > 1 ? ` +${opts.length - 1}` : "")
          : moveUsed && player.movedLayer !== l.id ? "Next round" : "Choose an option";
        const Icon = LAYER_ICON[l.id];
        const isSel = selectedLayer === l.id;
        const isExp = exposed.has(l.id);
        const isMove = interactive && player.movedLayer === l.id;
        const lockedRound = moveUsed && player.movedLayer !== l.id; // can't act on this layer this round
        const Tag = interactive ? "button" : "div";
        return (
          <Tag
            key={l.id}
            className={`stack-block ${built ? "built" : "empty"} ${isSel ? "sel" : ""} ${isExp ? "exposed" : ""} ${lockedRound ? "locked-round" : ""}`}
            onClick={interactive ? () => onSelect?.(l.id) : undefined}
            {...(interactive ? { type: "button" as const } : {})}
          >
            <span className="sb-icon"><Icon size={20} /></span>
            <span className="sb-text">
              <span className="sb-layer tiny mono">{l.index} · {l.name}</span>
              <span className="sb-opt">{label}</span>
            </span>
            <span className="sb-side">
              {built && units > 0 && <span className="sb-units tiny mono" title="Units / capacity">{units}u</span>}
              {isMove && <span className="sb-move tiny">this turn</span>}
              {isExp && <Warning size={16} className="sb-warn" />}
              {built ? <Check size={16} className="sb-check" /> : interactive && !lockedRound ? <CaretRight size={16} /> : null}
            </span>
          </Tag>
        );
      })}
    </div>
  );
}
