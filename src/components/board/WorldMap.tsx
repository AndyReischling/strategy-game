import { useEffect, useRef, useState, useCallback } from "react";
import type { TableState, Player, LayerId } from "../../data/types";
import { REGION_BY_ID, BENCHMARK_MARKERS } from "../../data/regions";
import { OPTION_BY_ID } from "../../data/layers";
import { exposedLayers } from "../../engine/offswitch";
import { Building } from "./Building";
import { CONTINENTS, CLOUDS } from "./mapPaths";
import { COLOR_HEX } from "../util";

const BOARD_H = 64; // board units tall (x is 0..100)
const tx = (x: number) => `${x}%`;
const ty = (y: number) => `${(y / BOARD_H) * 100}%`;

const LAYER_ORDER: LayerId[] = ["chips", "compute", "model", "weights", "hosting"];
const OFFSETS = [
  { dx: -4.6, dy: 0.4 },
  { dx: -2.3, dy: -2.4 },
  { dx: 0.2, dy: -3.6 },
  { dx: 2.7, dy: -2.4 },
  { dx: 4.8, dy: 0.4 },
];

interface Props {
  table: TableState;
  meId: string;
  reducedMotion: boolean;
}

export function WorldMap({ table, meId, reducedMotion }: Props) {
  const inspectId = meId;
  const [orbit, setOrbit] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  const me = table.players.find((p) => p.id === meId);

  const focusRegion = useCallback((player?: Player) => {
    const anchor = player ? REGION_BY_ID[player.regionId]?.anchor : undefined;
    if (!anchor) { setPan({ x: 0, y: 0 }); setZoom(1); return; }
    setZoom(1.9);
    setPan({ x: (50 - anchor.x) * 1.9, y: ((BOARD_H / 2 - anchor.y) / BOARD_H) * 100 * 1.9 });
  }, []);

  // On mobile, default to a zoomed-in "your region" view (§10.4)
  useEffect(() => {
    if (window.innerWidth < 760 && me?.regionId) focusRegion(me);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = (e.clientX - drag.current.x) / 6;
    const dy = (e.clientY - drag.current.y) / 6;
    setPan({ x: drag.current.px + dx, y: drag.current.py + dy });
  };
  const onPointerUp = () => { drag.current = null; };
  const onWheel = (e: React.WheelEvent) => {
    setZoom((z) => Math.min(3.2, Math.max(0.7, z - e.deltaY * 0.0012)));
  };

  const planeTransform = `rotateX(52deg) rotateZ(${orbit}deg)`;
  const billboard = `rotateZ(${-orbit}deg) rotateX(-52deg)`;

  // Off-switch board reactions
  const jolt = table.phase === "off-switch" && table.lastRoll?.triggered;

  return (
    <div className="board-wrap">
      <div className="board-3d" onWheel={onWheel} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}>
        <div
          className={`board-cam ${jolt ? "jolt" : ""}`}
          style={{ transform: `translate(${pan.x}%, ${pan.y}%) scale(${zoom})` }}
        >
          <div className={`board-plane ${reducedMotion ? "" : "sway"}`} style={{ transform: planeTransform }}>
            {/* Ocean */}
            <div className="ocean halftone" aria-hidden />

            {/* Continents */}
            <svg className="map-svg" viewBox="0 0 100 64" preserveAspectRatio="none" aria-hidden>
              <defs>
                <pattern id="landdots" width="2.2" height="2.2" patternUnits="userSpaceOnUse">
                  <circle cx="0.6" cy="0.6" r="0.42" fill="#1a1a18" opacity="0.18" />
                </pattern>
              </defs>
              {CONTINENTS.map((d, i) => (
                <g key={i}>
                  <path d={d} fill="#ede8dc" stroke="#1a1a18" strokeWidth="0.6" strokeLinejoin="round" />
                  <path d={d} fill="url(#landdots)" />
                </g>
              ))}
            </svg>

            {/* Deal roads (flat on the board) */}
            <svg className="roads-svg" viewBox="0 0 100 64" preserveAspectRatio="none" aria-hidden>
              {table.deals.filter((d) => d.active && !d.broken).map((d) => {
                const a = REGION_BY_ID[table.players.find((p) => p.id === d.fromPlayerId)?.regionId ?? ""]?.anchor;
                const b = REGION_BY_ID[table.players.find((p) => p.id === d.toPlayerId)?.regionId ?? ""]?.anchor;
                if (!a || !b) return null;
                return (
                  <line key={d.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                    stroke="#1a1a18" strokeWidth="0.5"
                    strokeDasharray={d.standing ? "2 1.4" : "0"}
                    className={d.standing ? "road pulse" : "road"} />
                );
              })}
            </svg>

            {/* Benchmark + alternative-supply markers */}
            {BENCHMARK_MARKERS.map((m) => (
              <div key={m.id} className={`bench ${m.dominant ? "dominant" : ""}`} style={{ left: tx(m.anchor.x), top: ty(m.anchor.y), transform: `translate(-50%,-100%) ${billboard}` }}>
                <div className="bench-stack">
                  {m.dominant ? "🏙️🏢🏭" : m.id === "china" ? "🏯" : "🎓"}
                </div>
                <div className="bench-label tiny mono">{m.flag} {m.name}</div>
              </div>
            ))}

            {/* Player territories + skylines */}
            {table.players.filter((p) => p.ready).map((p) => {
              const region = REGION_BY_ID[p.regionId];
              if (!region) return null;
              const a = region.anchor;
              const exposed = new Set(exposedLayers(p).map((e) => e.layer));
              const damaged = new Set(
                table.lastRoll?.results.find((r) => r.playerId === p.id)?.damagedLayers ?? [],
              );
              const isMe = p.id === inspectId;
              return (
                <div key={p.id} className="territory-group">
                  {/* lit territory patch */}
                  <div
                    className={`territory ${isMe ? "mine" : ""}`}
                    style={{ left: tx(a.x), top: ty(a.y), background: COLOR_HEX[p.color] }}
                  />
                  {/* name plate (billboarded) */}
                  <div className="nameplate" style={{ left: tx(a.x), top: ty(a.y + 3), transform: `translate(-50%,0) ${billboard}` }}>
                    <span className={`np c-${p.color}`}><span className="np-dot spot-bg" />{region.flag} {p.name}</span>
                  </div>
                  {/* skyline */}
                  {LAYER_ORDER.map((layer, i) => {
                    const optId = p.picks[layer];
                    if (!optId) return null;
                    const opt = OPTION_BY_ID[optId];
                    const off = OFFSETS[i];
                    return (
                      <div key={layer} className="bld-anchor" style={{ left: tx(a.x + off.dx), top: ty(a.y + off.dy), transform: `translate(-50%,-100%) ${billboard}` }}>
                        <Building layer={layer} option={opt} color={p.color} exposed={exposed.has(layer)} damaged={damaged.has(layer)} rising scale={0.9} />
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* drifting clouds */}
            {!reducedMotion && CLOUDS.map((c, i) => (
              <div key={i} className="cloud" style={{ left: tx(c.x), top: ty(c.y), transform: `${billboard} scale(${c.s})`, animationDuration: `${c.d}s` }}>☁</div>
            ))}
          </div>
        </div>
      </div>

      {/* Board controls (§10.3) */}
      <div className="board-controls">
        <button className="btn btn-sm" aria-label="Orbit left" onClick={() => setOrbit((o) => o - 15)}>↺</button>
        <button className="btn btn-sm" aria-label="Orbit right" onClick={() => setOrbit((o) => o + 15)}>↻</button>
        <button className="btn btn-sm" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(3.2, z + 0.3))}>+</button>
        <button className="btn btn-sm" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(0.7, z - 0.3))}>−</button>
        <button className="btn btn-sm" aria-label="My region" onClick={() => focusRegion(me)}>◉ Me</button>
        <button className="btn btn-sm" aria-label="Whole world" onClick={() => { setOrbit(0); focusRegion(undefined); }}>🌍</button>
      </div>
    </div>
  );
}
