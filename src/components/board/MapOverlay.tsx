import { useGame } from "../../store/useGame";
import { useReducedMotion } from "../useReducedMotion";
import { WorldMap } from "./WorldMap";
import { X } from "../icons";

// The riso world map, kept as an optional "World view" (geography of the
// dependency problem + deal roads) rather than the primary turn surface.
export function MapOverlay({ onClose }: { onClose: () => void }) {
  const table = useGame((s) => s.table)!;
  const playerId = useGame((s) => s.playerId);
  const reduced = useReducedMotion();
  return (
    <div className="map-overlay">
      <div className="map-overlay-bar">
        <span className="display">World view</span>
        <span className="tiny muted grow">Where the real infrastructure sits — and the deals wiring it together.</span>
        <button className="btn btn-sm" onClick={onClose}><X size={15} /> Close</button>
      </div>
      <div className="map-overlay-board">
        <WorldMap table={table} meId={playerId} reducedMotion={reduced} />
      </div>
    </div>
  );
}
